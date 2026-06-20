import uuid
from decimal import Decimal

from sqlalchemy import Integer, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ParametroAuxilio(Base):
    """Valores de auxílio alimentação/saúde por competência (ano/mês).

    Espelha a aba "Parâmetros Auxílios" da planilha oficial. Semeado por migration.
    """

    __tablename__ = "parametros_auxilio"
    __table_args__ = (UniqueConstraint("ano", "mes", name="uq_parametros_auxilio_ano_mes"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ano: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    mes: Mapped[int] = mapped_column(Integer, nullable=False)
    auxilio_alimentacao: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    auxilio_saude: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    auxilio_saude_condicional: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
