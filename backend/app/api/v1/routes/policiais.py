from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.core.constants import POSTOS_GRADUACOES
from app.crud import policial as crud
from app.schemas.common import PostoGraduacao
from app.schemas.policial import PolicialCreate, PolicialPublic, PolicialUpdate

router = APIRouter()


@router.get("/postos", response_model=list[str])
def listar_postos(_: CurrentUser) -> list[str]:
    return POSTOS_GRADUACOES


@router.get("", response_model=list[PolicialPublic])
def listar_policiais(
    db: DbSession,
    _: CurrentUser,
    response: Response,
    posto_graduacao: PostoGraduacao | None = None,
    busca: str | None = Query(default=None, max_length=80),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=10),
) -> list[PolicialPublic]:
    policiais, total = crud.list_policiais(
        db,
        posto_graduacao=posto_graduacao,
        busca=busca,
        offset=(page - 1) * per_page,
        limit=per_page,
    )
    response.headers["X-Total-Count"] = str(total)
    return policiais


@router.get("/{policial_id}", response_model=PolicialPublic)
def buscar_policial(policial_id: UUID, db: DbSession, _: CurrentUser) -> PolicialPublic:
    policial = crud.get_policial(db, policial_id)
    if not policial:
        raise HTTPException(status_code=404, detail="Policial militar não encontrado.")
    return policial


@router.post("", response_model=PolicialPublic, status_code=status.HTTP_201_CREATED)
def criar_policial(data: PolicialCreate, db: DbSession, _: CurrentUser) -> PolicialPublic:
    if crud.get_policial_by_matricula(db, data.matricula):
        raise HTTPException(status_code=409, detail="Já existe policial com esta matrícula.")
    try:
        return crud.create_policial(db, data)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe policial com esta matrícula.") from exc


@router.put("/{policial_id}", response_model=PolicialPublic)
def atualizar_policial(
    policial_id: UUID, data: PolicialUpdate, db: DbSession, _: CurrentUser
) -> PolicialPublic:
    policial = crud.get_policial(db, policial_id)
    if not policial:
        raise HTTPException(status_code=404, detail="Policial militar não encontrado.")
    existente = crud.get_policial_by_matricula(db, data.matricula)
    if existente and existente.id != policial.id:
        raise HTTPException(status_code=409, detail="Já existe policial com esta matrícula.")
    try:
        return crud.update_policial(db, policial, data)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe policial com esta matrícula.") from exc


@router.delete("/{policial_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_policial(policial_id: UUID, db: DbSession, _: CurrentUser) -> None:
    policial = crud.get_policial(db, policial_id)
    if not policial:
        raise HTTPException(status_code=404, detail="Policial militar não encontrado.")
    crud.delete_policial(db, policial)
