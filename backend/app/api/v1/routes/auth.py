from datetime import timedelta

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.crud.usuario import get_usuario_by_email
from app.schemas.auth import LoginRequest, Token
from app.schemas.usuario import UsuarioPublic

router = APIRouter()


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: DbSession) -> Token:
    usuario = get_usuario_by_email(db, data.email)
    if not usuario or not verify_password(data.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )
    token = create_access_token(
        str(usuario.id), timedelta(minutes=settings.access_token_expire_minutes)
    )
    return Token(access_token=token)


@router.get("/me", response_model=UsuarioPublic)
def me(usuario: CurrentUser) -> UsuarioPublic:
    return usuario
