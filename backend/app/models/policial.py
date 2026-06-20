import uuid

from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PolicialMilitar(Base):
    __tablename__ = "policiais_militares"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    posto_graduacao: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    matricula: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    nome_completo: Mapped[str] = mapped_column(String(180), index=True, nullable=False)
    opm: Mapped[str] = mapped_column(String(60), nullable=False, default="7º BPM")

    requerimentos: Mapped[list["Requerimento"]] = relationship(
        back_populates="policial", cascade="all, delete-orphan"
    )
