from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PostoGraduacao


class PolicialBase(BaseModel):
    posto_graduacao: PostoGraduacao
    matricula: int = Field(gt=0)
    nome_completo: str = Field(min_length=3, max_length=180)


class PolicialCreate(PolicialBase):
    pass


class PolicialUpdate(PolicialBase):
    pass


class PolicialPublic(PolicialBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
