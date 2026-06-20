import re
from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core import calculo_constants as C
from app.schemas.policial import PolicialPublic


class RequerimentoEventoIn(BaseModel):
    # `ano` é o ano de referência (competência) do evento; `data_recebido` é a data
    # de pagamento, cujo ano pode diferir do de referência (ex.: abono de 2021 pago
    # em 2022). Ambos limitados a 2021-2026.
    tipo_evento: str
    ano: int = Field(ge=C.ANO_INICIAL, le=C.ANO_FINAL)
    data_recebido: date
    valor_auxilio_saude: Decimal = Field(gt=0)

    @field_validator("tipo_evento")
    @classmethod
    def validar_tipo(cls, value: str) -> str:
        if value not in C.TIPOS_EVENTO:
            raise ValueError("Tipo de evento inválido.")
        return value

    @field_validator("data_recebido")
    @classmethod
    def validar_ano_data(cls, value: date) -> date:
        if not (C.ANO_INICIAL <= value.year <= C.ANO_FINAL):
            raise ValueError(
                f"A data de recebimento deve estar entre {C.ANO_INICIAL} e {C.ANO_FINAL}."
            )
        return value


class RequerimentoEventoPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tipo_evento: str
    ano: int
    data_recebido: date
    valor_auxilio_saude: Decimal | None


class RequerimentoBase(BaseModel):
    policial_id: UUID
    num_processo_sei_requerimento: str = Field(min_length=19, max_length=19)
    data_recebimento_opm: date
    hora_recebimento_opm: time
    num_sei_certidao_opm: str = Field(min_length=1, max_length=40)
    tem_afastamentos: bool = False
    gozou_ferias_5_anos: bool = False
    tem_prioridade_legal: bool = False
    enviado_para_cp: bool = False
    eventos: list[RequerimentoEventoIn] = []

    @field_validator("num_processo_sei_requerimento")
    @classmethod
    def validar_processo_sei(cls, value: str) -> str:
        if not re.fullmatch(r"\d{4}\.\d{6}/\d{4}-\d{2}", value):
            raise ValueError("O processo SEI deve estar no formato 0000.000000/0000-00.")
        return value

    @field_validator("eventos")
    @classmethod
    def validar_eventos_unicos(cls, eventos: list[RequerimentoEventoIn]) -> list[RequerimentoEventoIn]:
        chaves = {(e.tipo_evento, e.ano) for e in eventos}
        if len(chaves) != len(eventos):
            raise ValueError("Há eventos duplicados (mesmo tipo e ano).")
        return eventos


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
    eventos: list[RequerimentoEventoPublic]


class RequerimentoEnviadoCp(BaseModel):
    enviado_para_cp: bool
