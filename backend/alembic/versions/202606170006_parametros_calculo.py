"""tabelas de parametros do calculo (auxilios e indices ipca-e) com seed

Revision ID: 202606170006
Revises: 202606170005
Create Date: 2026-06-20
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

from app.core.calculo_seed import indices_seed_rows, parametros_seed_rows

revision: str = "202606170006"
down_revision: str | None = "202606170005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    parametros = op.create_table(
        "parametros_auxilio",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("auxilio_alimentacao", sa.Numeric(10, 2), nullable=False),
        sa.Column("auxilio_saude", sa.Numeric(10, 2), nullable=False),
        sa.Column("auxilio_saude_condicional", sa.Numeric(10, 2), nullable=False),
        sa.UniqueConstraint("ano", "mes", name="uq_parametros_auxilio_ano_mes"),
    )
    op.create_index("ix_parametros_auxilio_ano", "parametros_auxilio", ["ano"])

    indices = op.create_table(
        "indices_correcao",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("percentual_mensal", sa.Numeric(12, 8), nullable=False),
        sa.UniqueConstraint("ano", "mes", name="uq_indices_correcao_ano_mes"),
    )
    op.create_index("ix_indices_correcao_ano", "indices_correcao", ["ano"])

    op.bulk_insert(
        parametros,
        [{"id": uuid.uuid4(), **row} for row in parametros_seed_rows()],
    )
    op.bulk_insert(
        indices,
        [{"id": uuid.uuid4(), **row} for row in indices_seed_rows()],
    )


def downgrade() -> None:
    op.drop_index("ix_indices_correcao_ano", table_name="indices_correcao")
    op.drop_table("indices_correcao")
    op.drop_index("ix_parametros_auxilio_ano", table_name="parametros_auxilio")
    op.drop_table("parametros_auxilio")
