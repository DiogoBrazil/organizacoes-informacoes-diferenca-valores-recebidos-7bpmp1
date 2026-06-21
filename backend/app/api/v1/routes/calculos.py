from urllib.parse import quote
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser, DbSession
from app.crud import calculo as crud
from app.crud import parametros as parametros_crud
from app.crud import requerimento as requerimento_crud
from app.models.calculo import Calculo
from app.models.requerimento import Requerimento
from app.schemas.calculo import (
    CalculoAfastamentoPublic,
    CalculoIn,
    CalculoLancamentoPublic,
    CalculoPublic,
    ResumoLinhaPublic,
)
from app.services import calculo_service as service
from app.services import export_ods_service

router = APIRouter()


def _get_requerimento(db: DbSession, requerimento_id: UUID) -> Requerimento:
    requerimento = requerimento_crud.get_requerimento(db, requerimento_id)
    if not requerimento:
        raise HTTPException(status_code=404, detail="Requerimento não encontrado.")
    return requerimento


def _calcular(db: DbSession, requerimento: Requerimento, dados: CalculoIn):
    parametros = parametros_crud.load_parametros_map(db)
    indices = parametros_crud.load_indices_map(db)
    # Lançamentos derivados dos eventos do requerimento; o tipo de auxílio saúde
    # é derivado do valor (==50 -> SAUDE, senão CONDICIONAL). Eventos legados sem
    # valor são ignorados (não há como determinar o tipo).
    lancamentos = [
        service.LancamentoInput(
            e.data_recebido,
            e.tipo_evento,
            service.tipo_auxilio_from_valor(e.valor_auxilio_saude),
        )
        for e in requerimento.eventos
        if e.valor_auxilio_saude is not None
    ]
    afastamentos = [
        service.AfastamentoInput(a.modalidade, a.data_inicio, a.data_fim)
        for a in dados.afastamentos
    ]
    return service.calcular(
        lancamentos,
        afastamentos,
        requerimento.data_recebimento_opm,
        parametros,
        indices,
    )


def _public_from_resultado(
    resultado: service.ResultadoCalculo, requerimento_id: UUID
) -> CalculoPublic:
    return CalculoPublic(
        id=None,
        requerimento_id=requerimento_id,
        data_base_correcao=resultado.data_base_correcao,
        data_limite_prescricao=resultado.data_limite_prescricao,
        versao_planilha=resultado.versao_planilha,
        total_abono_corrigido=resultado.total_abono_corrigido,
        total_terco_ferias_corrigido=resultado.total_terco_ferias_corrigido,
        total_decimo_terceiro_corrigido=resultado.total_decimo_terceiro_corrigido,
        total_geral_a_receber=resultado.total_geral_a_receber,
        avos_13_por_ano=resultado.avos_13_por_ano,
        lancamentos=[CalculoLancamentoPublic.model_validate(l) for l in resultado.lancamentos],
        afastamentos=[CalculoAfastamentoPublic.model_validate(a) for a in resultado.afastamentos],
        resumo=[ResumoLinhaPublic.model_validate(r) for r in resultado.resumo],
        persistido=False,
    )


def _public_from_orm(calculo: Calculo, requerimento: Requerimento) -> CalculoPublic:
    resumo = service.montar_resumo(calculo.lancamentos)
    avos13 = service.avos_13_por_ano(
        [
            service.AfastamentoInput(a.modalidade, a.data_inicio, a.data_fim)
            for a in calculo.afastamentos
        ]
    )
    return CalculoPublic(
        id=calculo.id,
        requerimento_id=calculo.requerimento_id,
        data_base_correcao=calculo.data_base_correcao,
        data_limite_prescricao=service.data_limite_prescricao(
            requerimento.data_recebimento_opm
        ),
        versao_planilha=calculo.versao_planilha,
        total_abono_corrigido=calculo.total_abono_corrigido,
        total_terco_ferias_corrigido=calculo.total_terco_ferias_corrigido,
        total_decimo_terceiro_corrigido=calculo.total_decimo_terceiro_corrigido,
        total_geral_a_receber=calculo.total_geral_a_receber,
        avos_13_por_ano=avos13,
        lancamentos=[CalculoLancamentoPublic.model_validate(l) for l in calculo.lancamentos],
        afastamentos=[CalculoAfastamentoPublic.model_validate(a) for a in calculo.afastamentos],
        resumo=[ResumoLinhaPublic.model_validate(r) for r in resumo],
        persistido=True,
        criado_em=calculo.criado_em,
        atualizado_em=calculo.atualizado_em,
    )


@router.get("/{requerimento_id}/calculo", response_model=CalculoPublic)
def obter_calculo(requerimento_id: UUID, db: DbSession, _: CurrentUser) -> CalculoPublic:
    requerimento = _get_requerimento(db, requerimento_id)
    calculo = crud.get_by_requerimento(db, requerimento_id)
    if not calculo:
        raise HTTPException(
            status_code=404, detail="Este requerimento ainda não possui cálculo salvo."
        )
    return _public_from_orm(calculo, requerimento)


@router.post("/{requerimento_id}/calculo/simular", response_model=CalculoPublic)
def simular_calculo(
    requerimento_id: UUID, dados: CalculoIn, db: DbSession, _: CurrentUser
) -> CalculoPublic:
    requerimento = _get_requerimento(db, requerimento_id)
    resultado = _calcular(db, requerimento, dados)
    return _public_from_resultado(resultado, requerimento_id)


@router.put("/{requerimento_id}/calculo", response_model=CalculoPublic)
def salvar_calculo(
    requerimento_id: UUID, dados: CalculoIn, db: DbSession, usuario: CurrentUser
) -> CalculoPublic:
    requerimento = _get_requerimento(db, requerimento_id)
    resultado = _calcular(db, requerimento, dados)
    calculo = crud.upsert(db, requerimento_id, resultado, usuario.id)
    return _public_from_orm(calculo, requerimento)


@router.delete("/{requerimento_id}/calculo", status_code=status.HTTP_204_NO_CONTENT)
def excluir_calculo(requerimento_id: UUID, db: DbSession, _: CurrentUser) -> None:
    _get_requerimento(db, requerimento_id)
    calculo = crud.get_by_requerimento(db, requerimento_id)
    if not calculo:
        raise HTTPException(status_code=404, detail="Cálculo não encontrado.")
    crud.delete(db, calculo)


def _nome_arquivo_ods(requerimento: Requerimento) -> str:
    pol = requerimento.policial
    base = f"{pol.matricula}_{pol.posto_graduacao}_{pol.nome_completo}_DIF_ABONO_TERÇO_13º"
    base = base.replace("/", "-").replace(" ", "_")
    return f"{base}.ods"


@router.get("/{requerimento_id}/calculo/export.ods")
def exportar_calculo_ods(
    requerimento_id: UUID, db: DbSession, _: CurrentUser
) -> StreamingResponse:
    """Gera a planilha oficial (modelo CP9) em .ods preenchendo o template."""
    requerimento = _get_requerimento(db, requerimento_id)
    calculo = crud.get_by_requerimento(db, requerimento_id)
    if not calculo:
        raise HTTPException(
            status_code=404, detail="Este requerimento ainda não possui cálculo salvo."
        )
    conteudo = export_ods_service.gerar_ods(requerimento, calculo)
    nome = _nome_arquivo_ods(requerimento)
    return StreamingResponse(
        iter([conteudo]),
        media_type="application/vnd.oasis.opendocument.spreadsheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(nome)}"},
    )
