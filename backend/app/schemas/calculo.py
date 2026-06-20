from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.core import calculo_constants as C


# --------------------------------------------------------------------------- #
# Entradas
# --------------------------------------------------------------------------- #
class CalculoLancamentoIn(BaseModel):
    data_recebido: date
    tipo_evento: str
    tipo_auxilio_saude: str

    @field_validator("data_recebido")
    @classmethod
    def validar_ano(cls, value: date) -> date:
        if not (C.ANO_INICIAL <= value.year <= C.ANO_FINAL):
            raise ValueError(
                f"A data deve estar entre {C.ANO_INICIAL} e {C.ANO_FINAL}."
            )
        return value

    @field_validator("tipo_evento")
    @classmethod
    def validar_evento(cls, value: str) -> str:
        if value not in C.TIPOS_EVENTO:
            raise ValueError("Tipo de evento inválido.")
        return value

    @field_validator("tipo_auxilio_saude")
    @classmethod
    def validar_auxilio(cls, value: str) -> str:
        if value not in C.TIPOS_AUX_SAUDE:
            raise ValueError("Tipo de auxílio saúde inválido.")
        return value


class CalculoAfastamentoIn(BaseModel):
    modalidade: str
    data_inicio: date
    data_fim: date

    @field_validator("modalidade")
    @classmethod
    def validar_modalidade(cls, value: str) -> str:
        if value not in C.MODALIDADES_AFASTAMENTO:
            raise ValueError("Modalidade de afastamento inválida.")
        return value

    @model_validator(mode="after")
    def validar_periodo(self) -> "CalculoAfastamentoIn":
        if self.data_fim < self.data_inicio:
            raise ValueError("A data final não pode ser anterior à data inicial.")
        return self


class CalculoIn(BaseModel):
    lancamentos: list[CalculoLancamentoIn] = []
    afastamentos: list[CalculoAfastamentoIn] = []


# --------------------------------------------------------------------------- #
# Saídas
# --------------------------------------------------------------------------- #
class CalculoLancamentoPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ordem: int
    data_recebido: date
    tipo_evento: str
    tipo_auxilio_saude: str
    ano: int
    mes: int
    valor_auxilio_alimentacao: Decimal
    valor_auxilio_saude_aplicavel: Decimal
    base_complementar: Decimal
    avos_13: Decimal
    diferenca_terco_ferias: Decimal
    diferenca_abono: Decimal
    diferenca_13: Decimal
    diferenca_original: Decimal
    competencia_correcao: date
    fator_correcao: Decimal
    valor_corrigido_original: Decimal
    percentual_aplicavel: Decimal
    diferenca_ajustada: Decimal
    valor_corrigido_ajustado: Decimal
    tem_afastamento_reflexo: bool
    prescrito: bool
    motivo_ajuste: str


class CalculoAfastamentoPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    modalidade: str
    data_inicio: date
    data_fim: date
    avos_por_ano: dict[int, int]
    observacao: str


class ResumoLinhaPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tipo_evento: str
    ano: int
    data_evento: date | None
    tipo_auxilio_saude: str
    valor_auxilio_saude: Decimal
    valor_auxilio_alimentacao: Decimal
    base_complementar: Decimal
    avos_13: Decimal
    fator_correcao: Decimal
    diferenca_ajustada: Decimal
    diferenca_corrigida: Decimal
    prescrito: bool


class CalculoPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID | None = None
    requerimento_id: UUID
    data_base_correcao: date
    data_limite_prescricao: date
    versao_planilha: str
    total_abono_corrigido: Decimal
    total_terco_ferias_corrigido: Decimal
    total_decimo_terceiro_corrigido: Decimal
    total_geral_a_receber: Decimal
    avos_13_por_ano: dict[int, Decimal]
    lancamentos: list[CalculoLancamentoPublic]
    afastamentos: list[CalculoAfastamentoPublic]
    resumo: list[ResumoLinhaPublic]
    persistido: bool = False
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
