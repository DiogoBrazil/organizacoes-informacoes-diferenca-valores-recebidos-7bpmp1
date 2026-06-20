import uuid
from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Requerimento(Base):
    __tablename__ = "requerimentos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policial_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policiais_militares.id", ondelete="CASCADE"), nullable=False
    )
    num_processo_sei_requerimento: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )
    data_recebimento_opm: Mapped[date] = mapped_column(Date, nullable=False)
    hora_recebimento_opm: Mapped[time] = mapped_column(Time, nullable=False)
    num_sei_certidao_opm: Mapped[str] = mapped_column(String(40), nullable=False)
    tem_afastamentos: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gozou_ferias_5_anos: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tem_prioridade_legal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    enviado_para_cp: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    abono_pecuniario_2021: Mapped[str | None] = mapped_column(String(20))
    ferias_1_3_2021: Mapped[str | None] = mapped_column(String(20))
    abono_pecuniario_2022: Mapped[str | None] = mapped_column(String(20))
    ferias_1_3_2022: Mapped[str | None] = mapped_column(String(20))
    abono_pecuniario_2023: Mapped[str | None] = mapped_column(String(20))
    ferias_1_3_2023: Mapped[str | None] = mapped_column(String(20))
    abono_pecuniario_2024: Mapped[str | None] = mapped_column(String(20))
    ferias_1_3_2024: Mapped[str | None] = mapped_column(String(20))
    abono_pecuniario_2025: Mapped[str | None] = mapped_column(String(20))
    ferias_1_3_2025: Mapped[str | None] = mapped_column(String(20))

    auxilio_saude_2021: Mapped[str | None] = mapped_column(String(20))
    auxilio_saude_2022: Mapped[str | None] = mapped_column(String(20))
    auxilio_saude_2023: Mapped[str | None] = mapped_column(String(20))
    auxilio_saude_2024: Mapped[str | None] = mapped_column(String(20))
    auxilio_saude_2025: Mapped[str | None] = mapped_column(String(20))
    auxilio_saude_2026: Mapped[str | None] = mapped_column(String(20))

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    policial: Mapped["PolicialMilitar"] = relationship(back_populates="requerimentos")
    calculo: Mapped["Calculo | None"] = relationship(
        back_populates="requerimento", uselist=False, cascade="all, delete-orphan"
    )
