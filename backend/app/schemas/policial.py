from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import PostoGraduacao


class PolicialBase(BaseModel):
    posto_graduacao: PostoGraduacao
    matricula: int = Field(ge=100000000, le=100099999)
    nome_completo: str = Field(min_length=3, max_length=180)

    @field_validator("matricula")
    @classmethod
    def validar_matricula(cls, value: int) -> int:
        matricula = str(value)
        if len(matricula) != 9 or not matricula.startswith("1000"):
            raise ValueError("A matrícula deve ter 9 dígitos e iniciar com 1000.")
        return value


class PolicialCreate(PolicialBase):
    pass


class PolicialUpdate(PolicialBase):
    pass


class PolicialPublic(PolicialBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
