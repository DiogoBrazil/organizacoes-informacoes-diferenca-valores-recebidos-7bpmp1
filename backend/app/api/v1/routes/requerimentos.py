from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.core.constants import POSTOS_GRADUACOES
from app.crud import policial as policial_crud
from app.crud import requerimento as crud
from app.schemas.common import PostoGraduacao
from app.schemas.requerimento import (
    RequerimentoCreate,
    RequerimentoEnviadoCp,
    RequerimentoPublic,
    RequerimentoUpdate,
)

router = APIRouter()


@router.get("/contadores", response_model=dict[str, int])
def contadores_por_posto(db: DbSession, _: CurrentUser) -> dict[str, int]:
    counts = crud.count_by_posto(db)
    return {posto: counts.get(posto, 0) for posto in POSTOS_GRADUACOES}


@router.get("", response_model=list[RequerimentoPublic])
def listar_requerimentos(
    db: DbSession,
    _: CurrentUser,
    response: Response,
    posto_graduacao: PostoGraduacao | None = None,
    busca: str | None = Query(default=None, max_length=80),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=10),
) -> list[RequerimentoPublic]:
    requerimentos, total = crud.list_requerimentos(
        db,
        posto_graduacao=posto_graduacao,
        busca=busca,
        offset=(page - 1) * per_page,
        limit=per_page,
    )
    response.headers["X-Total-Count"] = str(total)
    return requerimentos


@router.get("/{requerimento_id}", response_model=RequerimentoPublic)
def buscar_requerimento(
    requerimento_id: UUID, db: DbSession, _: CurrentUser
) -> RequerimentoPublic:
    requerimento = crud.get_requerimento(db, requerimento_id)
    if not requerimento:
        raise HTTPException(status_code=404, detail="Requerimento não encontrado.")
    return requerimento


@router.post("", response_model=RequerimentoPublic, status_code=status.HTTP_201_CREATED)
def criar_requerimento(
    data: RequerimentoCreate, db: DbSession, _: CurrentUser
) -> RequerimentoPublic:
    if not policial_crud.get_policial(db, data.policial_id):
        raise HTTPException(status_code=404, detail="Policial militar não encontrado.")
    if crud.get_requerimento_by_processo_sei(db, data.num_processo_sei_requerimento):
        raise HTTPException(status_code=409, detail="Já existe requerimento com este processo SEI.")
    try:
        return crud.create_requerimento(db, data)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe requerimento com este processo SEI.") from exc


@router.put("/{requerimento_id}", response_model=RequerimentoPublic)
def atualizar_requerimento(
    requerimento_id: UUID, data: RequerimentoUpdate, db: DbSession, _: CurrentUser
) -> RequerimentoPublic:
    requerimento = crud.get_requerimento(db, requerimento_id)
    if not requerimento:
        raise HTTPException(status_code=404, detail="Requerimento não encontrado.")
    if not policial_crud.get_policial(db, data.policial_id):
        raise HTTPException(status_code=404, detail="Policial militar não encontrado.")
    existente = crud.get_requerimento_by_processo_sei(db, data.num_processo_sei_requerimento)
    if existente and existente.id != requerimento.id:
        raise HTTPException(status_code=409, detail="Já existe requerimento com este processo SEI.")
    try:
        return crud.update_requerimento(db, requerimento, data)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe requerimento com este processo SEI.") from exc


@router.patch("/{requerimento_id}/enviado-cp", response_model=RequerimentoPublic)
def atualizar_enviado_para_cp(
    requerimento_id: UUID, data: RequerimentoEnviadoCp, db: DbSession, _: CurrentUser
) -> RequerimentoPublic:
    requerimento = crud.get_requerimento(db, requerimento_id)
    if not requerimento:
        raise HTTPException(status_code=404, detail="Requerimento não encontrado.")
    return crud.set_enviado_para_cp(db, requerimento, data.enviado_para_cp)


@router.delete("/{requerimento_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_requerimento(requerimento_id: UUID, db: DbSession, _: CurrentUser) -> None:
    requerimento = crud.get_requerimento(db, requerimento_id)
    if not requerimento:
        raise HTTPException(status_code=404, detail="Requerimento não encontrado.")
    crud.delete_requerimento(db, requerimento)
