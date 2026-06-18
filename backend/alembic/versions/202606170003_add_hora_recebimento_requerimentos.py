"""add hora recebimento requerimentos

Revision ID: 202606170003
Revises: 202606170002
Create Date: 2026-06-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202606170003"
down_revision: str | None = "202606170002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "requerimentos",
        sa.Column(
            "hora_recebimento_opm",
            sa.Time(),
            nullable=False,
            server_default=sa.text("'00:00:00'"),
        ),
    )
    op.alter_column("requerimentos", "hora_recebimento_opm", server_default=None)


def downgrade() -> None:
    op.drop_column("requerimentos", "hora_recebimento_opm")
