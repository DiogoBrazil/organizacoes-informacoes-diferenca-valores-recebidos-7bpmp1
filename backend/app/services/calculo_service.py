"""Núcleo de cálculo das diferenças de abono, 1/3 de férias e 13º.

Reproduz, de forma determinística e testável, as fórmulas da planilha oficial CP9
(abas Lançamentos, Afastamentos e Resumo). Todo o cálculo usa ``Decimal`` com
precisão plena; o arredondamento para 2 casas ocorre apenas na exibição/exportação.

O serviço é puro: recebe os parâmetros de auxílio e os índices IPCA-E já carregados
(dicionários indexados por (ano, mês)), sem acessar o banco diretamente.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.core import calculo_constants as C

DOZE = Decimal(12)
TRES = Decimal(3)
MEIO = Decimal("0.5")

# Tipos dos dicionários de apoio.
ParametrosMap = dict[tuple[int, int], tuple[Decimal, Decimal, Decimal]]
IndicesMap = dict[tuple[int, int], Decimal]


# --------------------------------------------------------------------------- #
# Entradas
# --------------------------------------------------------------------------- #
@dataclass
class LancamentoInput:
    data_recebido: date
    tipo_evento: str
    tipo_auxilio_saude: str


@dataclass
class AfastamentoInput:
    modalidade: str
    data_inicio: date
    data_fim: date


# --------------------------------------------------------------------------- #
# Saídas
# --------------------------------------------------------------------------- #
@dataclass
class LancamentoCalculado:
    ordem: int
    data_recebido: date
    tipo_evento: str
    tipo_auxilio_saude: str
    ano: int
    mes: int
    valor_auxilio_alimentacao: Decimal
    valor_auxilio_saude_aplicavel: Decimal
    base_complementar: Decimal
    avos_13: Decimal
    diferenca_terco_ferias: Decimal
    diferenca_abono: Decimal
    diferenca_13: Decimal
    diferenca_original: Decimal
    competencia_correcao: date
    fator_correcao: Decimal
    valor_corrigido_original: Decimal
    percentual_aplicavel: Decimal
    diferenca_ajustada: Decimal
    valor_corrigido_ajustado: Decimal
    tem_afastamento_reflexo: bool
    prescrito: bool
    motivo_ajuste: str


@dataclass
class AfastamentoCalculado:
    modalidade: str
    data_inicio: date
    data_fim: date
    avos_por_ano: dict[int, int]
    observacao: str


@dataclass
class ResumoLinha:
    tipo_evento: str
    ano: int
    data_evento: date | None
    tipo_auxilio_saude: str
    valor_auxilio_saude: Decimal
    valor_auxilio_alimentacao: Decimal
    base_complementar: Decimal
    avos_13: Decimal
    fator_correcao: Decimal
    diferenca_ajustada: Decimal
    diferenca_corrigida: Decimal
    prescrito: bool


@dataclass
class ResultadoCalculo:
    lancamentos: list[LancamentoCalculado]
    afastamentos: list[AfastamentoCalculado]
    resumo: list[ResumoLinha]
    total_abono_corrigido: Decimal
    total_terco_ferias_corrigido: Decimal
    total_decimo_terceiro_corrigido: Decimal
    total_geral_a_receber: Decimal
    data_base_correcao: date
    data_limite_prescricao: date
    versao_planilha: str
    avos_13_por_ano: dict[int, int] = field(default_factory=dict)


# --------------------------------------------------------------------------- #
# Funções puras de cálculo
# --------------------------------------------------------------------------- #
def avos_periodo(inicio: date, fim: date) -> int:
    """Avos de um período contínuo, com a regra do dia 15 (aba Afastamentos, col M).

    MIN(12; MAX(0; (anoF-anoI)*12 + mesF - mesI - 1
        + (diaI<=15 ? 1 : 0) + (diaF>=15 ? 1 : 0)))
    """
    meses = (
        (fim.year - inicio.year) * 12
        + (fim.month - inicio.month)
        - 1
        + (1 if inicio.day <= 15 else 0)
        + (1 if fim.day >= 15 else 0)
    )
    return max(0, min(12, meses))


def avos_afastamento_no_ano(inicio: date, fim: date, ano: int) -> int:
    """Avos de um afastamento dentro de um ano civil (rateio jan-dez)."""
    jan1 = date(ano, 1, 1)
    dez31 = date(ano, 12, 31)
    if fim < jan1 or inicio > dez31:
        return 0
    d = max(inicio, jan1)
    e = min(fim, dez31)
    return avos_periodo(d, e)


def avos_13_por_ano(afastamentos: list[AfastamentoInput]) -> dict[int, int]:
    """Avos remuneratórios do 13º por ano civil (matriz da aba Afastamentos).

    avos = MAX(0; 12 - (LAC+LTSD>6+LTIP+EXCLUÍDO+LICENCIADO+DESERTOR) - PRESO*0,5)
    LTSD reduz somente o excedente a 6 avos (180 dias no ano civil).
    PRESO TRANS. JULG. reduz metade dos avos.
    """
    resultado: dict[int, int] = {}
    for ano in C.ANOS:
        somas: dict[str, int] = {mod: 0 for mod in C.MODALIDADES_AFASTAMENTO}
        for af in afastamentos:
            if af.modalidade not in somas:
                continue
            somas[af.modalidade] += avos_afastamento_no_ano(
                af.data_inicio, af.data_fim, ano
            )
        ltsd = max(0, somas[C.MOD_LTSD] - C.LTSD_AVOS_LIVRES)
        reduz_integral = (
            somas[C.MOD_LAC]
            + ltsd
            + somas[C.MOD_LTIP]
            + somas[C.MOD_EXCLUIDO]
            + somas[C.MOD_LICENCIADO]
            + somas[C.MOD_DESERTOR]
        )
        preso = somas[C.MOD_PRESO]
        avos = DOZE - Decimal(reduz_integral) - Decimal(preso) * MEIO
        if avos < 0:
            avos = Decimal(0)
        resultado[ano] = avos
    return resultado


def _iter_competencias(ano: int, mes: int, ate: tuple[int, int]):
    """Itera (ano, mês) da competência informada até ``ate`` (inclusive)."""
    y, m = ano, mes
    while (y, m) <= ate:
        yield (y, m)
        m += 1
        if m > 12:
            m = 1
            y += 1


def fator_correcao(
    ano: int,
    mes: int,
    indices: IndicesMap,
    ate: tuple[int, int] = C.ULTIMA_COMPETENCIA_OFICIAL,
) -> Decimal:
    """Fator acumulado IPCA-E da competência até a última oficial (inclusive).

    Produto composto de (1 + percentual) sem juros e sem projeção: meses sem
    índice divulgado contribuem com fator 1.
    """
    if (ano, mes) > ate:
        return Decimal(1)
    fator = Decimal(1)
    for comp in _iter_competencias(ano, mes, ate):
        percentual = indices.get(comp)
        if percentual is not None:
            fator *= Decimal(1) + percentual
    return fator


def _observacao_afastamento(modalidade: str) -> str:
    if modalidade == C.MOD_LTSD:
        return (
            "LTSD: reflexo somente após 180 dias no ano civil; a tabela superior "
            "subtrai apenas o excedente a 6 avos."
        )
    if modalidade == C.MOD_PRESO:
        return "Sentença transitada em julgado: 50% da remuneração no período."
    if modalidade == C.MOD_LAC:
        return "LAC: com prejuízo da remuneração e da contagem de tempo."
    if modalidade == C.MOD_LTIP:
        return "LTIP: sem remuneração."
    return "Afastamento com reflexo remuneratório."


def data_limite_prescricao(data_protocolo: date) -> date:
    """data_protocolo - 5 anos (replica DATE(YEAR-5; MONTH; DAY) da planilha)."""
    try:
        return data_protocolo.replace(year=data_protocolo.year - C.ANOS_PRESCRICAO)
    except ValueError:  # 29/02 em ano não bissexto
        return data_protocolo.replace(
            year=data_protocolo.year - C.ANOS_PRESCRICAO, day=28
        )


def calcular_lancamento(
    ordem: int,
    inp: LancamentoInput,
    parametros: ParametrosMap,
    indices: IndicesMap,
    avos13_por_ano: dict[int, int],
    data_limite_prescricao: date,
) -> LancamentoCalculado:
    ano = inp.data_recebido.year
    mes = inp.data_recebido.month

    alim, saude, condicional = parametros.get(
        (ano, mes), (Decimal(0), Decimal(0), Decimal(0))
    )
    if inp.tipo_auxilio_saude == C.AUX_CONDICIONAL:
        aux_saude_aplicavel = condicional
    elif inp.tipo_auxilio_saude == C.AUX_SAUDE:
        aux_saude_aplicavel = saude
    else:
        aux_saude_aplicavel = Decimal(0)

    base = alim + aux_saude_aplicavel  # base complementar (col L)

    avos_ano = avos13_por_ano.get(ano, DOZE)
    avos_13 = avos_ano if inp.tipo_evento == C.EVENTO_13 else DOZE

    # Diferenças por tipo de evento (cols M, N, O).
    dif_terco = base / TRES if inp.tipo_evento == C.EVENTO_TERCO_FERIAS else Decimal(0)
    # Abono = (base/3) + ((base/3)/3); equivale a base * 4/9.
    dif_abono = (
        (base / TRES) + (base / TRES) / TRES
        if inp.tipo_evento == C.EVENTO_ABONO
        else Decimal(0)
    )
    dif_13 = (
        base * (avos_13 / DOZE) if inp.tipo_evento == C.EVENTO_13 else Decimal(0)
    )
    dif_original = dif_terco + dif_abono + dif_13  # col P

    competencia = date(ano, mes, 1)
    fator = fator_correcao(ano, mes, indices)  # col R
    valor_corr_original = dif_original * fator  # col S

    # Afastamento com reflexo no ano civil bloqueia abono/férias (cols T, U).
    tem_reflexo = avos_ano < DOZE
    if inp.tipo_evento == C.EVENTO_13:
        percentual = Decimal(1)
    else:
        percentual = Decimal(0) if tem_reflexo else Decimal(1)

    dif_ajustada = dif_original * percentual  # col W
    valor_corr_ajustado = dif_ajustada * fator  # col X

    prescrito = inp.data_recebido < data_limite_prescricao

    if tem_reflexo:
        motivo = (
            C.MOTIVO_13_POR_AVOS
            if inp.tipo_evento == C.EVENTO_13
            else C.MOTIVO_FERIAS_BLOQUEADO
        )
    else:
        motivo = C.MOTIVO_SEM_AFASTAMENTO

    return LancamentoCalculado(
        ordem=ordem,
        data_recebido=inp.data_recebido,
        tipo_evento=inp.tipo_evento,
        tipo_auxilio_saude=inp.tipo_auxilio_saude,
        ano=ano,
        mes=mes,
        valor_auxilio_alimentacao=alim,
        valor_auxilio_saude_aplicavel=aux_saude_aplicavel,
        base_complementar=base,
        avos_13=avos_13,
        diferenca_terco_ferias=dif_terco,
        diferenca_abono=dif_abono,
        diferenca_13=dif_13,
        diferenca_original=dif_original,
        competencia_correcao=competencia,
        fator_correcao=fator,
        valor_corrigido_original=valor_corr_original,
        percentual_aplicavel=percentual,
        diferenca_ajustada=dif_ajustada,
        valor_corrigido_ajustado=valor_corr_ajustado,
        tem_afastamento_reflexo=tem_reflexo,
        prescrito=prescrito,
        motivo_ajuste=motivo,
    )


def montar_resumo(lancamentos) -> list[ResumoLinha]:
    """Agrupa por (tipo_evento, ano) na ordem da planilha (Resumo).

    Aceita tanto ``LancamentoCalculado`` (simulação) quanto os modelos ORM
    persistidos, por compartilharem os mesmos nomes de atributo.
    """
    resumo: list[ResumoLinha] = []
    for evento in C.TIPOS_EVENTO:
        for ano in C.ANOS:
            grupo = [
                l for l in lancamentos if l.tipo_evento == evento and l.ano == ano
            ]
            if not grupo:
                continue
            rep = grupo[0]
            prescrito = rep.prescrito
            ajustada = sum((l.diferenca_ajustada for l in grupo), Decimal(0))
            corrigida = (
                Decimal(0)
                if prescrito
                else sum((l.valor_corrigido_ajustado for l in grupo), Decimal(0))
            )
            resumo.append(
                ResumoLinha(
                    tipo_evento=evento,
                    ano=ano,
                    data_evento=rep.data_recebido,
                    tipo_auxilio_saude=rep.tipo_auxilio_saude,
                    valor_auxilio_saude=sum(
                        (l.valor_auxilio_saude_aplicavel for l in grupo), Decimal(0)
                    ),
                    valor_auxilio_alimentacao=sum(
                        (l.valor_auxilio_alimentacao for l in grupo), Decimal(0)
                    ),
                    base_complementar=sum(
                        (l.base_complementar for l in grupo), Decimal(0)
                    ),
                    avos_13=rep.avos_13,
                    fator_correcao=rep.fator_correcao,
                    diferenca_ajustada=ajustada,
                    diferenca_corrigida=corrigida,
                    prescrito=prescrito,
                )
            )
    return resumo


def calcular(
    lancamentos: list[LancamentoInput],
    afastamentos: list[AfastamentoInput],
    data_protocolo: date,
    parametros: ParametrosMap,
    indices: IndicesMap,
    data_base_correcao: date = C.DATA_BASE_CORRECAO,
) -> ResultadoCalculo:
    """Calcula o resultado completo do cálculo de diferenças (snapshot)."""
    avos13 = avos_13_por_ano(afastamentos)
    data_limite = data_limite_prescricao(data_protocolo)

    calc_lancamentos = [
        calcular_lancamento(i + 1, inp, parametros, indices, avos13, data_limite)
        for i, inp in enumerate(lancamentos)
    ]

    calc_afastamentos = [
        AfastamentoCalculado(
            modalidade=af.modalidade,
            data_inicio=af.data_inicio,
            data_fim=af.data_fim,
            avos_por_ano={
                ano: avos_afastamento_no_ano(af.data_inicio, af.data_fim, ano)
                for ano in C.ANOS
            },
            observacao=_observacao_afastamento(af.modalidade),
        )
        for af in afastamentos
    ]

    resumo = montar_resumo(calc_lancamentos)

    def total(evento: str) -> Decimal:
        return sum(
            (
                l.valor_corrigido_ajustado
                for l in calc_lancamentos
                if l.tipo_evento == evento and not l.prescrito
            ),
            Decimal(0),
        )

    total_abono = total(C.EVENTO_ABONO)
    total_terco = total(C.EVENTO_TERCO_FERIAS)
    total_13 = total(C.EVENTO_13)

    return ResultadoCalculo(
        lancamentos=calc_lancamentos,
        afastamentos=calc_afastamentos,
        resumo=resumo,
        total_abono_corrigido=total_abono,
        total_terco_ferias_corrigido=total_terco,
        total_decimo_terceiro_corrigido=total_13,
        total_geral_a_receber=total_abono + total_terco + total_13,
        data_base_correcao=data_base_correcao,
        data_limite_prescricao=data_limite,
        versao_planilha=C.VERSAO_PLANILHA,
        avos_13_por_ano=avos13,
    )
