"""Testes do núcleo de cálculo, validados contra a planilha oficial CP9."""

from datetime import date
from decimal import ROUND_HALF_UP, Decimal

import pytest

from app.core import calculo_constants as C
from app.core.calculo_seed import indices_map, parametros_map
from app.services import calculo_service as cs

PARAMETROS = parametros_map()
INDICES = indices_map()


def _r2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _d(texto: str) -> date:
    dia, mes, ano = texto.split("/")
    return date(int(ano), int(mes), int(dia))


def _lanc(data: str, evento: str, saude: str) -> cs.LancamentoInput:
    return cs.LancamentoInput(_d(data), evento, saude)


# 15 lançamentos do exemplo da planilha (aba Lançamentos, linhas 8-22).
EXEMPLO = [
    _lanc("30/06/2021", C.EVENTO_ABONO, C.AUX_SAUDE),
    _lanc("30/06/2021", C.EVENTO_TERCO_FERIAS, C.AUX_SAUDE),
    _lanc("30/12/2021", C.EVENTO_13, C.AUX_SAUDE),
    _lanc("30/06/2022", C.EVENTO_ABONO, C.AUX_CONDICIONAL),
    _lanc("30/06/2022", C.EVENTO_TERCO_FERIAS, C.AUX_SAUDE),
    _lanc("30/06/2022", C.EVENTO_13, C.AUX_SAUDE),
    _lanc("30/06/2023", C.EVENTO_ABONO, C.AUX_SAUDE),
    _lanc("30/06/2023", C.EVENTO_TERCO_FERIAS, C.AUX_SAUDE),
    _lanc("30/06/2023", C.EVENTO_13, C.AUX_SAUDE),
    _lanc("30/06/2024", C.EVENTO_ABONO, C.AUX_CONDICIONAL),
    _lanc("30/06/2024", C.EVENTO_TERCO_FERIAS, C.AUX_SAUDE),
    _lanc("30/12/2024", C.EVENTO_13, C.AUX_SAUDE),
    _lanc("30/06/2025", C.EVENTO_ABONO, C.AUX_SAUDE),
    _lanc("30/06/2025", C.EVENTO_TERCO_FERIAS, C.AUX_SAUDE),
    _lanc("30/12/2025", C.EVENTO_13, C.AUX_CONDICIONAL),
]
PROTOCOLO = date(2026, 6, 21)


def _calcular(lancamentos, afastamentos=None):
    return cs.calcular(
        lancamentos,
        afastamentos or [],
        PROTOCOLO,
        PARAMETROS,
        INDICES,
    )


# --------------------------------------------------------------------------- #
# Fatores de correção
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "ano,mes,esperado",
    [
        (2021, 6, "1.33553090"),
        (2021, 12, "1.25876634"),
        (2022, 6, "1.19033880"),
        (2024, 12, "1.07933949"),
        (2026, 5, "1.00620000"),
    ],
)
def test_fator_correcao_bate_planilha(ano, mes, esperado):
    fator = cs.fator_correcao(ano, mes, INDICES)
    assert fator.quantize(Decimal("0.00000001")) == Decimal(esperado)


def test_fator_competencia_alem_da_data_base_e_um():
    assert cs.fator_correcao(2027, 1, INDICES) == Decimal(1)


# --------------------------------------------------------------------------- #
# Tipo de auxílio saúde derivado do valor (==50 -> SAUDE, senão CONDICIONAL)
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "valor,esperado",
    [
        ("50", C.AUX_SAUDE),
        ("50.00", C.AUX_SAUDE),
        ("150", C.AUX_CONDICIONAL),
        ("150.00", C.AUX_CONDICIONAL),
        ("75.50", C.AUX_CONDICIONAL),
    ],
)
def test_tipo_auxilio_from_valor(valor, esperado):
    assert cs.tipo_auxilio_from_valor(Decimal(valor)) == esperado


def test_tipo_auxilio_from_valor_none_e_condicional():
    assert cs.tipo_auxilio_from_valor(None) == C.AUX_CONDICIONAL


# --------------------------------------------------------------------------- #
# Cenário completo da planilha (sem afastamento)
# --------------------------------------------------------------------------- #
def test_total_geral_bate_planilha():
    res = _calcular(EXEMPLO)
    assert _r2(res.total_abono_corrigido) == Decimal("951.29")
    assert _r2(res.total_terco_ferias_corrigido) == Decimal("637.02")
    assert _r2(res.total_decimo_terceiro_corrigido) == Decimal("1979.83")
    assert _r2(res.total_geral_a_receber) == Decimal("3568.14")


def test_base_complementar_e_diferenca_abono():
    res = _calcular(EXEMPLO)
    abono_2021 = res.lancamentos[0]
    assert abono_2021.base_complementar == Decimal("302.50")  # 252,50 + 50,00
    # Abono = base*4/9 = 302,50*4/9 = 134,4444...
    assert _r2(abono_2021.diferenca_abono) == Decimal("134.44")
    assert _r2(abono_2021.valor_corrigido_ajustado) == Decimal("179.55")


def test_condicional_usa_150():
    res = _calcular(EXEMPLO)
    abono_2022 = res.lancamentos[3]  # 30/06/2022 ABONO CONDICIONAL
    assert abono_2022.valor_auxilio_saude_aplicavel == Decimal("150.00")
    assert abono_2022.base_complementar == Decimal("466.23")  # 316,23 + 150,00


# --------------------------------------------------------------------------- #
# Prescrição quinquenal (operador estritamente menor)
# --------------------------------------------------------------------------- #
def test_prescricao_estritamente_menor():
    # Protocolo 30/06/2026 => limite 30/06/2021.
    lanc = [
        _lanc("29/06/2021", C.EVENTO_ABONO, C.AUX_SAUDE),  # antes do limite -> prescrito
        _lanc("30/06/2021", C.EVENTO_ABONO, C.AUX_SAUDE),  # exatamente no limite -> NÃO
    ]
    res = cs.calcular(lanc, [], date(2026, 6, 30), PARAMETROS, INDICES)
    assert res.lancamentos[0].prescrito is True
    assert res.lancamentos[1].prescrito is False
    # Apenas o não prescrito compõe o total.
    assert res.total_abono_corrigido == res.lancamentos[1].valor_corrigido_ajustado


# --------------------------------------------------------------------------- #
# Afastamentos: 13º proporcional, bloqueio de abono/férias, LTSD, PRESO
# --------------------------------------------------------------------------- #
def test_13_proporcional_e_bloqueio_abono_ferias_por_afastamento():
    # LTIP de 01/04/2023 a 30/09/2023: 6 avos no ano (abr..set, dias 15).
    afast = [cs.AfastamentoInput(C.MOD_LTIP, _d("01/04/2023"), _d("30/09/2023"))]
    lanc = [
        _lanc("30/06/2023", C.EVENTO_ABONO, C.AUX_SAUDE),
        _lanc("30/06/2023", C.EVENTO_TERCO_FERIAS, C.AUX_SAUDE),
        _lanc("30/12/2023", C.EVENTO_13, C.AUX_SAUDE),
    ]
    res = cs.calcular(lanc, afast, PROTOCOLO, PARAMETROS, INDICES)
    assert res.avos_13_por_ano[2023] == Decimal(6)  # 12 - 6
    abono, ferias, decimo = res.lancamentos
    # Abono e 1/3 bloqueados (percentual 0) em ano com reflexo.
    assert abono.percentual_aplicavel == Decimal(0)
    assert abono.diferenca_ajustada == Decimal(0)
    assert ferias.diferenca_ajustada == Decimal(0)
    assert abono.motivo_ajuste == C.MOTIVO_FERIAS_BLOQUEADO
    # 13º proporcional aos avos (6/12 da base).
    assert decimo.avos_13 == Decimal(6)
    assert decimo.diferenca_13 == decimo.base_complementar * (Decimal(6) / Decimal(12))
    assert decimo.motivo_ajuste == C.MOTIVO_13_POR_AVOS


def test_ltsd_so_reduz_excedente_a_6():
    # LTSD de 01/01/2022 a 31/12/2022 = 12 avos; reduz só 12-6 = 6.
    afast = [cs.AfastamentoInput(C.MOD_LTSD, _d("01/01/2022"), _d("31/12/2022"))]
    res = cs.calcular([], afast, PROTOCOLO, PARAMETROS, INDICES)
    assert res.avos_13_por_ano[2022] == Decimal(6)  # 12 - (12-6)


def test_ltsd_ate_6_nao_reduz():
    # LTSD de 01/01/2022 a 30/06/2022 = 6 avos; não reduz (<=6).
    afast = [cs.AfastamentoInput(C.MOD_LTSD, _d("01/01/2022"), _d("30/06/2022"))]
    res = cs.calcular([], afast, PROTOCOLO, PARAMETROS, INDICES)
    assert res.avos_13_por_ano[2022] == Decimal(12)


def test_preso_reduz_metade_dos_avos():
    # PRESO 01/01/2024 a 31/12/2024 = 12 avos; reduz 12*0,5 = 6 => avos 6.
    afast = [cs.AfastamentoInput(C.MOD_PRESO, _d("01/01/2024"), _d("31/12/2024"))]
    res = cs.calcular([], afast, PROTOCOLO, PARAMETROS, INDICES)
    assert res.avos_13_por_ano[2024] == Decimal(6)


def test_avos_periodo_regra_dia_15():
    # Início dia <=15 conta avo; fim dia >=15 conta avo.
    assert cs.avos_periodo(date(2023, 4, 10), date(2023, 9, 20)) == 6
    # Início após dia 15 não conta o mês inicial.
    assert cs.avos_periodo(date(2023, 4, 16), date(2023, 9, 20)) == 5


def test_rateio_por_ano_civil():
    # Afastamento atravessando 2022-2023 é rateado por ano.
    af = cs.AfastamentoInput(C.MOD_LTIP, _d("01/11/2022"), _d("28/02/2023"))
    assert cs.avos_afastamento_no_ano(af.data_inicio, af.data_fim, 2022) == 2
    assert cs.avos_afastamento_no_ano(af.data_inicio, af.data_fim, 2023) == 2
