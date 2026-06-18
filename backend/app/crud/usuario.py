from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate


def get_usuario(db: Session, usuario_id: UUID) -> Usuario | None:
    return db.get(Usuario, usuario_id)


def get_usuario_by_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(Usuario.email == email.lower()))


def list_usuarios(
    db: Session, busca: str | None = None, offset: int = 0, limit: int | None = None
) -> tuple[list[Usuario], int]:
    stmt = select(Usuario)
    if busca:
        like = f"%{busca.strip()}%"
        stmt = stmt.where(or_(Usuario.nome_completo.ilike(like), Usuario.email.ilike(like)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    stmt = stmt.order_by(Usuario.nome_completo.asc())
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt).all()), total


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
