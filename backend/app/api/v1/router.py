from fastapi import APIRouter

from app.api.v1.routes import auth, policiais, requerimentos, usuarios

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
api_router.include_router(policiais.router, prefix="/policiais", tags=["Policiais Militares"])
api_router.include_router(requerimentos.router, prefix="/requerimentos", tags=["Requerimentos"])
