"""add enviado para cp requerimentos

Revision ID: 202606170004
Revises: 202606170003
Create Date: 2026-06-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202606170004"
down_revision: str | None = "202606170003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "requerimentos",
        sa.Column(
            "enviado_para_cp",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.alter_column("requerimentos", "enviado_para_cp", server_default=None)


def downgrade() -> None:
    op.drop_column("requerimentos", "enviado_para_cp")
