from datetime import date, datetime
import re
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.policial import PolicialPublic


class RequerimentoBase(BaseModel):
    policial_id: UUID
    num_processo_sei_requerimento: str = Field(min_length=19, max_length=19)
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

    @field_validator("num_processo_sei_requerimento")
    @classmethod
    def validar_processo_sei(cls, value: str) -> str:
        if not re.fullmatch(r"\d{4}\.\d{6}/\d{4}-\d{2}", value):
            raise ValueError("O processo SEI deve estar no formato 0000.000000/0000-00.")
        return value

    @field_validator(
        "abono_pecuniario_2021",
        "ferias_1_3_2021",
        "abono_pecuniario_2022",
        "ferias_1_3_2022",
        "abono_pecuniario_2023",
        "ferias_1_3_2023",
        "abono_pecuniario_2024",
        "ferias_1_3_2024",
        "abono_pecuniario_2025",
        "ferias_1_3_2025",
        mode="before",
    )
    @classmethod
    def validar_mes_ano(cls, value: str | None) -> str | None:
        if value in (None, ""):
            return None
        if not isinstance(value, str):
            raise ValueError("Informe mês/ano no formato mmm/aaaa, por exemplo out/2022.")
        normalized = value.lower().strip().replace("./", "/")
        if not re.fullmatch(r"[a-z]{3}/\d{4}", normalized):
            raise ValueError("Informe mês/ano no formato mmm/aaaa, por exemplo out/2022.")
        return normalized

    @field_validator(
        "auxilio_saude_2021",
        "auxilio_saude_2022",
        "auxilio_saude_2023",
        "auxilio_saude_2024",
        "auxilio_saude_2025",
        "auxilio_saude_2026",
        mode="before",
    )
    @classmethod
    def validar_valor_brasileiro(cls, value: str | None) -> str | None:
        if value in (None, ""):
            return None
        if not isinstance(value, str):
            raise ValueError("Informe o valor no formato 50,00.")
        normalized = value.strip().replace(".", ",")
        if re.fullmatch(r"\d+", normalized):
            return f"{normalized},00"
        if re.fullmatch(r"\d+,\d", normalized):
            return f"{normalized}0"
        if not re.fullmatch(r"\d+,\d{2}", normalized):
            raise ValueError("Informe o valor no formato 50,00.")
        return normalized


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
