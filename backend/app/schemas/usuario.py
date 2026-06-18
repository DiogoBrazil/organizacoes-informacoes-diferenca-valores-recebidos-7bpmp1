from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UsuarioBase(BaseModel):
    nome_completo: str = Field(min_length=3, max_length=180)
    email: str = Field(min_length=5, max_length=180)

    @field_validator("email")
    @classmethod
    def validar_email(cls, value: str) -> str:
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("Informe um e-mail válido.")
        return value.lower()


class UsuarioCreate(UsuarioBase):
    senha: str = Field(min_length=6, max_length=128)


class UsuarioUpdate(BaseModel):
    nome_completo: str = Field(min_length=3, max_length=180)
    email: str = Field(min_length=5, max_length=180)

    @field_validator("email")
    @classmethod
    def validar_email(cls, value: str) -> str:
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("Informe um e-mail válido.")
        return value.lower()


class UsuarioSenhaUpdate(BaseModel):
    senha_atual: str = Field(min_length=1, max_length=128)
    senha: str = Field(min_length=6, max_length=128)


class UsuarioPublic(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    criado_em: datetime
