import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RequerimentoEvento(Base):
    """Evento financeiro do requerimento (Abono, 1/3 de férias ou 13º).

    Cada evento guarda a data completa do recebimento e o valor do auxílio saúde
    recebido naquele mês. O tipo (SAUDE/CONDICIONAL) é derivado do valor no cálculo.
    """

    __tablename__ = "requerimento_evento"
    __table_args__ = (
        UniqueConstraint(
            "requerimento_id", "tipo_evento", "ano", name="uq_req_evento_tipo_ano"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requerimento_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("requerimentos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tipo_evento: Mapped[str] = mapped_column(String(20), nullable=False)
    ano: Mapped[int] = mapped_column(Integer, nullable=False)
    data_recebido: Mapped[date] = mapped_column(Date, nullable=False)
    # Nullable apenas para acomodar dados legados migrados sem auxílio anual; a
    # validação Pydantic exige o valor em novos cadastros/edições.
    valor_auxilio_saude: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    requerimento: Mapped["Requerimento"] = relationship(back_populates="eventos")
