"""unique requerimento processo sei

Revision ID: 202606170002
Revises: 202606170001
Create Date: 2026-06-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202606170002"
down_revision: str | None = "202606170001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    duplicados = connection.execute(
        sa.text(
            """
            SELECT num_processo_sei_requerimento, COUNT(*) AS total
            FROM requerimentos
            GROUP BY num_processo_sei_requerimento
            HAVING COUNT(*) > 1
            ORDER BY num_processo_sei_requerimento
            """
        )
    ).fetchall()
    if duplicados:
        processos = ", ".join(f"{processo} ({total})" for processo, total in duplicados)
        raise RuntimeError(
            "Existem processos SEI duplicados em requerimentos. "
            f"Corrija antes de aplicar a migration: {processos}"
        )

    op.create_index(
        op.f("ix_requerimentos_num_processo_sei_requerimento"),
        "requerimentos",
        ["num_processo_sei_requerimento"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_requerimentos_num_processo_sei_requerimento"),
        table_name="requerimentos",
    )
