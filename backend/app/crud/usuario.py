from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate


def get_usuario(db: Session, usuario_id: UUID) -> Usuario | None:
    return db.get(Usuario, usuario_id)


def get_usuario_by_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(Usuario.email == email.lower()))


def list_usuarios(db: Session) -> list[Usuario]:
    return list(db.scalars(select(Usuario).order_by(Usuario.nome_completo.asc())).all())


def create_usuario(db: Session, data: UsuarioCreate) -> Usuario:
    usuario = Usuario(
        nome_completo=data.nome_completo.strip(),
        email=data.email.lower(),
        senha_hash=get_password_hash(data.senha),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def update_usuario(db: Session, usuario: Usuario, data: UsuarioUpdate) -> Usuario:
    usuario.nome_completo = data.nome_completo.strip()
    usuario.email = data.email.lower()
    db.commit()
    db.refresh(usuario)
    return usuario


def update_senha(db: Session, usuario: Usuario, senha: str) -> Usuario:
    usuario.senha_hash = get_password_hash(senha)
    db.commit()
    db.refresh(usuario)
    return usuario


def delete_usuario(db: Session, usuario: Usuario) -> None:
    db.delete(usuario)
    db.commit()
