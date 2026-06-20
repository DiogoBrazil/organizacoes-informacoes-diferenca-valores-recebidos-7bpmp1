import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Precisões: valores monetários/derivados com casas suficientes para não perder
# centavos vs. planilha; fator e percentual com 8 casas. Arredonda-se a 2 casas
# apenas na exibição/exportação.
MONEY = Numeric(18, 6)
FATOR = Numeric(16, 8)


class Calculo(Base):
    __tablename__ = "calculos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requerimento_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("requerimentos.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    data_base_correcao: Mapped[date] = mapped_column(Date, nullable=False)
    versao_planilha: Mapped[str] = mapped_column(String(40), nullable=False)

    total_abono_corrigido: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=0)
    total_terco_ferias_corrigido: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=0)
    total_decimo_terceiro_corrigido: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=0)
    total_geral_a_receber: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=0)

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    criado_por_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL")
    )
    atualizado_por_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL")
    )

    requerimento: Mapped["Requerimento"] = relationship(back_populates="calculo")
    lancamentos: Mapped[list["CalculoLancamento"]] = relationship(
        back_populates="calculo",
        cascade="all, delete-orphan",
        order_by="CalculoLancamento.ordem",
    )
    afastamentos: Mapped[list["CalculoAfastamento"]] = relationship(
        back_populates="calculo", cascade="all, delete-orphan"
    )


class CalculoLancamento(Base):
    __tablename__ = "calculo_lancamentos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("calculos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ordem: Mapped[int] = mapped_column(Integer, nullable=False)
    data_recebido: Mapped[date] = mapped_column(Date, nullable=False)
    tipo_evento: Mapped[str] = mapped_column(String(20), nullable=False)
    tipo_auxilio_saude: Mapped[str] = mapped_column(String(20), nullable=False)
    ano: Mapped[int] = mapped_column(Integer, nullable=False)
    mes: Mapped[int] = mapped_column(Integer, nullable=False)

    valor_auxilio_alimentacao: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    valor_auxilio_saude_aplicavel: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    base_complementar: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    avos_13: Mapped[Decimal] = mapped_column(Numeric(6, 3), nullable=False)
    diferenca_terco_ferias: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    diferenca_abono: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    diferenca_13: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    diferenca_original: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    competencia_correcao: Mapped[date] = mapped_column(Date, nullable=False)
    fator_correcao: Mapped[Decimal] = mapped_column(FATOR, nullable=False)
    valor_corrigido_original: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    percentual_aplicavel: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    diferenca_ajustada: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    valor_corrigido_ajustado: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    tem_afastamento_reflexo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    prescrito: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    motivo_ajuste: Mapped[str] = mapped_column(String(120), nullable=False, default="")

    calculo: Mapped["Calculo"] = relationship(back_populates="lancamentos")


class CalculoAfastamento(Base):
    __tablename__ = "calculo_afastamentos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("calculos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    modalidade: Mapped[str] = mapped_column(String(30), nullable=False)
    data_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    data_fim: Mapped[date] = mapped_column(Date, nullable=False)
    avos_por_ano: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    observacao: Mapped[str] = mapped_column(String(200), nullable=False, default="")

    calculo: Mapped["Calculo"] = relationship(back_populates="afastamentos")
