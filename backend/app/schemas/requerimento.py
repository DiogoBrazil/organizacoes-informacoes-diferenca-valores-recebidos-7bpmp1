from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.policial import PolicialPublic


class RequerimentoBase(BaseModel):
    policial_id: UUID
    num_processo_sei_requerimento: str = Field(min_length=5, max_length=30)
    data_recebimento_opm: date
    num_sei_certidao_opm: str = Field(min_length=1, max_length=40)
    tem_afastamentos: bool = False
    gozou_ferias_5_anos: bool = False
    tem_prioridade_legal: bool = False
    abono_pecuniario_2021: str | None = None
    ferias_1_3_2021: str | None = None
    abono_pecuniario_2022: str | None = None
    ferias_1_3_2022: str | None = None
    abono_pecuniario_2023: str | None = None
    ferias_1_3_2023: str | None = None
    abono_pecuniario_2024: str | None = None
    ferias_1_3_2024: str | None = None
    abono_pecuniario_2025: str | None = None
    ferias_1_3_2025: str | None = None
    auxilio_saude_2021: str | None = None
    auxilio_saude_2022: str | None = None
    auxilio_saude_2023: str | None = None
    auxilio_saude_2024: str | None = None
    auxilio_saude_2025: str | None = None
    auxilio_saude_2026: str | None = None


class RequerimentoCreate(RequerimentoBase):
    pass


class RequerimentoUpdate(RequerimentoBase):
    pass


class RequerimentoPublic(RequerimentoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    criado_em: datetime
    atualizado_em: datetime
    policial: PolicialPublic
