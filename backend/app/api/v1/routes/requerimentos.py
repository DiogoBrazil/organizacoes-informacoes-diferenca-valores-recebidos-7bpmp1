from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.core.constants import POSTOS_GRADUACOES
from app.crud import policial as policial_crud
from app.crud import requerimento as crud
from app.schemas.common import PostoGraduacao
from app.schemas.requerimento import RequerimentoCreate, RequerimentoPublic, RequerimentoUpdate

router = APIRouter()


@router.get("/contadores", response_model=dict[str, int])
def contadores_por_posto(db: DbSession, _: CurrentUser) -> dict[str, int]:
    counts = crud.count_by_posto(db)
    return {posto: counts.get(posto, 0) for posto in POSTOS_GRADUACOES}


@router.get("", response_model=list[RequerimentoPublic])
def listar_requerimentos(
    db: DbSession, _: CurrentUser, posto_graduacao: PostoGraduacao | None = None
) -> list[RequerimentoPublic]:
    return crud.list_requerimentos(db, posto_graduacao=posto_graduacao)


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
    return crud.create_requerimento(db, data)


@router.put("/{requerimento_id}", response_model=RequerimentoPublic)
def atualizar_requerimento(
    requerimento_id: UUID, data: RequerimentoUpdate, db: DbSession, _: CurrentUser
) -> RequerimentoPublic:
    requerimento = crud.get_requerimento(db, requerimento_id)
    if not requerimento:
        raise HTTPException(status_code=404, detail="Requerimento não encontrado.")
    if not policial_crud.get_policial(db, data.policial_id):
        raise HTTPException(status_code=404, detail="Policial militar não encontrado.")
    return crud.update_requerimento(db, requerimento, data)


@router.delete("/{requerimento_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_requerimento(requerimento_id: UUID, db: DbSession, _: CurrentUser) -> None:
    requerimento = crud.get_requerimento(db, requerimento_id)
    if not requerimento:
        raise HTTPException(status_code=404, detail="Requerimento não encontrado.")
    crud.delete_requerimento(db, requerimento)
