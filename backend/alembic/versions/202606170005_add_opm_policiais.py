"""add opm policiais militares

Revision ID: 202606170005
Revises: 202606170004
Create Date: 2026-06-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202606170005"
down_revision: str | None = "202606170004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. cria a coluna nullable com default para não quebrar registros existentes
    op.add_column(
        "policiais_militares",
        sa.Column(
            "opm",
            sa.String(length=60),
            nullable=True,
            server_default="7º BPM",
        ),
    )
    # 2. garante valor nos registros já existentes
    op.execute("UPDATE policiais_militares SET opm = '7º BPM' WHERE opm IS NULL")
    # 3. torna a coluna obrigatória
    op.alter_column("policiais_militares", "opm", nullable=False)
    # 4. remove o default de servidor (padrão fica a cargo da aplicação)
    op.alter_column("policiais_militares", "opm", server_default=None)


def downgrade() -> None:
    op.drop_column("policiais_militares", "opm")
