from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.crud.usuario import get_usuario_by_email
from app.models.usuario import Usuario

app = FastAPI(title="Sistema de Gestão de Requerimentos PMRO", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def seed_initial_admin(db: Session) -> None:
    if get_usuario_by_email(db, settings.initial_admin_email):
        return
    usuario = Usuario(
        nome_completo=settings.initial_admin_name,
        email=settings.initial_admin_email.lower(),
        senha_hash=get_password_hash(settings.initial_admin_password),
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_initial_admin(db)
    finally:
        db.close()
