"""reforca integridade entre requerimentos e calculos

Revision ID: 202606220001
Revises: 202606170008
Create Date: 2026-06-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202606220001"
down_revision: str | None = "202606170008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()

    bind.execute(
        sa.text(
            """
            DELETE FROM calculo_lancamentos cl
            WHERE NOT EXISTS (
                SELECT 1 FROM calculos c WHERE c.id = cl.calculo_id
            )
            """
        )
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM calculo_afastamentos ca
            WHERE NOT EXISTS (
                SELECT 1 FROM calculos c WHERE c.id = ca.calculo_id
            )
            """
        )
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM calculos c
            WHERE NOT EXISTS (
                SELECT 1 FROM requerimentos r WHERE r.id = c.requerimento_id
            )
            """
        )
    )

    bind.execute(
        sa.text(
            """
            ALTER TABLE calculo_lancamentos
            DROP CONSTRAINT IF EXISTS calculo_lancamentos_calculo_id_fkey
            """
        )
    )
    bind.execute(
        sa.text(
            """
            ALTER TABLE calculo_afastamentos
            DROP CONSTRAINT IF EXISTS calculo_afastamentos_calculo_id_fkey
            """
        )
    )
    bind.execute(
        sa.text(
            """
            ALTER TABLE calculos
            DROP CONSTRAINT IF EXISTS calculos_requerimento_id_fkey
            """
        )
    )

    op.create_foreign_key(
        "calculos_requerimento_id_fkey",
        "calculos",
        "requerimentos",
        ["requerimento_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "calculo_lancamentos_calculo_id_fkey",
        "calculo_lancamentos",
        "calculos",
        ["calculo_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "calculo_afastamentos_calculo_id_fkey",
        "calculo_afastamentos",
        "calculos",
        ["calculo_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "calculo_afastamentos_calculo_id_fkey",
        "calculo_afastamentos",
        type_="foreignkey",
    )
    op.drop_constraint(
        "calculo_lancamentos_calculo_id_fkey",
        "calculo_lancamentos",
        type_="foreignkey",
    )
    op.drop_constraint("calculos_requerimento_id_fkey", "calculos", type_="foreignkey")

    op.create_foreign_key(
        "calculos_requerimento_id_fkey",
        "calculos",
        "requerimentos",
        ["requerimento_id"],
        ["id"],
    )
    op.create_foreign_key(
        "calculo_lancamentos_calculo_id_fkey",
        "calculo_lancamentos",
        "calculos",
        ["calculo_id"],
        ["id"],
    )
    op.create_foreign_key(
        "calculo_afastamentos_calculo_id_fkey",
        "calculo_afastamentos",
        "calculos",
        ["calculo_id"],
        ["id"],
    )
