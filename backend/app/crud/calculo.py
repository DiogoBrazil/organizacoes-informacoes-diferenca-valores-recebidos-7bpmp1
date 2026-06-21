from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.calculo import Calculo, CalculoAfastamento, CalculoLancamento
from app.services.calculo_service import ResultadoCalculo


def get_by_requerimento(db: Session, requerimento_id: UUID) -> Calculo | None:
    stmt = (
        select(Calculo)
        .options(
            selectinload(Calculo.lancamentos),
            selectinload(Calculo.afastamentos),
        )
        .where(Calculo.requerimento_id == requerimento_id)
    )
    return db.scalar(stmt)


def _lancamento_model(ordem_l) -> CalculoLancamento:
    return CalculoLancamento(
        ordem=ordem_l.ordem,
        data_recebido=ordem_l.data_recebido,
        tipo_evento=ordem_l.tipo_evento,
        tipo_auxilio_saude=ordem_l.tipo_auxilio_saude,
        ano=ordem_l.ano,
        mes=ordem_l.mes,
        valor_auxilio_alimentacao=ordem_l.valor_auxilio_alimentacao,
        valor_auxilio_saude_aplicavel=ordem_l.valor_auxilio_saude_aplicavel,
        base_complementar=ordem_l.base_complementar,
        avos_13=ordem_l.avos_13,
        diferenca_terco_ferias=ordem_l.diferenca_terco_ferias,
        diferenca_abono=ordem_l.diferenca_abono,
        diferenca_13=ordem_l.diferenca_13,
        diferenca_original=ordem_l.diferenca_original,
        competencia_correcao=ordem_l.competencia_correcao,
        fator_correcao=ordem_l.fator_correcao,
        valor_corrigido_original=ordem_l.valor_corrigido_original,
        percentual_aplicavel=ordem_l.percentual_aplicavel,
        diferenca_ajustada=ordem_l.diferenca_ajustada,
        valor_corrigido_ajustado=ordem_l.valor_corrigido_ajustado,
        tem_afastamento_reflexo=ordem_l.tem_afastamento_reflexo,
        prescrito=ordem_l.prescrito,
        motivo_ajuste=ordem_l.motivo_ajuste,
    )


def upsert(
    db: Session,
    requerimento_id: UUID,
    resultado: ResultadoCalculo,
    usuario_id: UUID | None,
) -> Calculo:
    """Cria ou substitui (snapshot único) o cálculo do requerimento."""
    calculo = get_by_requerimento(db, requerimento_id)
    if calculo is None:
        calculo = Calculo(requerimento_id=requerimento_id, criado_por_id=usuario_id)
        db.add(calculo)
    else:
        # substitui os filhos do snapshot anterior (sem histórico de versões)
        calculo.lancamentos.clear()
        calculo.afastamentos.clear()

    calculo.data_base_correcao = resultado.data_base_correcao
    calculo.versao_planilha = resultado.versao_planilha
    calculo.total_abono_corrigido = resultado.total_abono_corrigido
    calculo.total_terco_ferias_corrigido = resultado.total_terco_ferias_corrigido
    calculo.total_decimo_terceiro_corrigido = resultado.total_decimo_terceiro_corrigido
    calculo.total_geral_a_receber = resultado.total_geral_a_receber
    calculo.atualizado_por_id = usuario_id

    calculo.lancamentos = [_lancamento_model(l) for l in resultado.lancamentos]
    calculo.afastamentos = [
        CalculoAfastamento(
            modalidade=a.modalidade,
            data_inicio=a.data_inicio,
            data_fim=a.data_fim,
            avos_por_ano=a.avos_por_ano,
            observacao=a.observacao,
        )
        for a in resultado.afastamentos
    ]

    db.commit()
    return get_by_requerimento(db, requerimento_id) or calculo


def delete(db: Session, calculo: Calculo) -> None:
    db.delete(calculo)
    db.commit()
