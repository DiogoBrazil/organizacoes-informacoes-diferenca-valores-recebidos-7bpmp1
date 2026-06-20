import uuid
from decimal import Decimal

from sqlalchemy import Integer, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class IndiceCorrecao(Base):
    """Percentual mensal IPCA-E (IBGE) por competência (ano/mês).

    Espelha a aba "Índices Correção" da planilha. O percentual é decimal
    (ex.: 0,78% = 0,0078). O fator acumulado é calculado de forma determinística
    no serviço de cálculo. Semeado por migration.
    """

    __tablename__ = "indices_correcao"
    __table_args__ = (UniqueConstraint("ano", "mes", name="uq_indices_correcao_ano_mes"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ano: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    mes: Mapped[int] = mapped_column(Integer, nullable=False)
    percentual_mensal: Mapped[Decimal] = mapped_column(Numeric(12, 8), nullable=False)
