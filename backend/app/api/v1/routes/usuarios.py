from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.core.security import verify_password
from app.crud import usuario as crud
from app.schemas.usuario import UsuarioCreate, UsuarioPublic, UsuarioSenhaUpdate, UsuarioUpdate

router = APIRouter()


@router.get("", response_model=list[UsuarioPublic])
def listar_usuarios(
    db: DbSession,
    _: CurrentUser,
    response: Response,
    busca: str | None = Query(default=None, max_length=80),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=10),
) -> list[UsuarioPublic]:
    usuarios, total = crud.list_usuarios(
        db, busca=busca, offset=(page - 1) * per_page, limit=per_page
    )
    response.headers["X-Total-Count"] = str(total)
    return usuarios


@router.get("/{usuario_id}", response_model=UsuarioPublic)
def buscar_usuario(usuario_id: UUID, db: DbSession, _: CurrentUser) -> UsuarioPublic:
    usuario = crud.get_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return usuario


@router.post("", response_model=UsuarioPublic, status_code=status.HTTP_201_CREATED)
def criar_usuario(data: UsuarioCreate, db: DbSession, _: CurrentUser) -> UsuarioPublic:
    if crud.get_usuario_by_email(db, data.email):
        raise HTTPException(status_code=409, detail="Já existe usuário com este e-mail.")
    try:
        return crud.create_usuario(db, data)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe usuário com este e-mail.") from exc


@router.put("/{usuario_id}", response_model=UsuarioPublic)
def atualizar_usuario(
    usuario_id: UUID, data: UsuarioUpdate, db: DbSession, _: CurrentUser
) -> UsuarioPublic:
    usuario = crud.get_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    existente = crud.get_usuario_by_email(db, data.email)
    if existente and existente.id != usuario.id:
        raise HTTPException(status_code=409, detail="Já existe usuário com este e-mail.")
    try:
        return crud.update_usuario(db, usuario, data)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe usuário com este e-mail.") from exc


@router.put("/{usuario_id}/senha", response_model=UsuarioPublic)
def atualizar_senha(
    usuario_id: UUID, data: UsuarioSenhaUpdate, db: DbSession, current_user: CurrentUser
) -> UsuarioPublic:
    if usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode alterar a sua própria senha.",
        )
    if not verify_password(data.senha_atual, current_user.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    return crud.update_senha(db, current_user, data.senha)


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_usuario(usuario_id: UUID, db: DbSession, _: CurrentUser) -> None:
    usuario = crud.get_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    crud.delete_usuario(db, usuario)
