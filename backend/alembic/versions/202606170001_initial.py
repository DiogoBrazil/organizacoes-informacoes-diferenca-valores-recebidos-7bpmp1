"""initial schema

Revision ID: 202606170001
Revises:
Create Date: 2026-06-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "202606170001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome_completo", sa.String(length=180), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("senha_hash", sa.String(length=255), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_usuarios_email"), "usuarios", ["email"], unique=True)

    op.create_table(
        "policiais_militares",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("posto_graduacao", sa.String(length=20), nullable=False),
        sa.Column("matricula", sa.Integer(), nullable=False),
        sa.Column("nome_completo", sa.String(length=180), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_policiais_militares_matricula"),
        "policiais_militares",
        ["matricula"],
        unique=True,
    )
    op.create_index(
        op.f("ix_policiais_militares_nome_completo"),
        "policiais_militares",
        ["nome_completo"],
        unique=False,
    )
    op.create_index(
        op.f("ix_policiais_militares_posto_graduacao"),
        "policiais_militares",
        ["posto_graduacao"],
        unique=False,
    )

    op.create_table(
        "requerimentos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("policial_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("num_processo_sei_requerimento", sa.String(length=30), nullable=False),
        sa.Column("data_recebimento_opm", sa.Date(), nullable=False),
        sa.Column("num_sei_certidao_opm", sa.String(length=40), nullable=False),
        sa.Column("tem_afastamentos", sa.Boolean(), nullable=False),
        sa.Column("gozou_ferias_5_anos", sa.Boolean(), nullable=False),
        sa.Column("tem_prioridade_legal", sa.Boolean(), nullable=False),
        sa.Column("abono_pecuniario_2021", sa.String(length=20), nullable=True),
        sa.Column("ferias_1_3_2021", sa.String(length=20), nullable=True),
        sa.Column("abono_pecuniario_2022", sa.String(length=20), nullable=True),
        sa.Column("ferias_1_3_2022", sa.String(length=20), nullable=True),
        sa.Column("abono_pecuniario_2023", sa.String(length=20), nullable=True),
        sa.Column("ferias_1_3_2023", sa.String(length=20), nullable=True),
        sa.Column("abono_pecuniario_2024", sa.String(length=20), nullable=True),
        sa.Column("ferias_1_3_2024", sa.String(length=20), nullable=True),
        sa.Column("abono_pecuniario_2025", sa.String(length=20), nullable=True),
        sa.Column("ferias_1_3_2025", sa.String(length=20), nullable=True),
        sa.Column("auxilio_saude_2021", sa.String(length=20), nullable=True),
        sa.Column("auxilio_saude_2022", sa.String(length=20), nullable=True),
        sa.Column("auxilio_saude_2023", sa.String(length=20), nullable=True),
        sa.Column("auxilio_saude_2024", sa.String(length=20), nullable=True),
        sa.Column("auxilio_saude_2025", sa.String(length=20), nullable=True),
        sa.Column("auxilio_saude_2026", sa.String(length=20), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["policial_id"], ["policiais_militares.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("requerimentos")
    op.drop_index(op.f("ix_policiais_militares_posto_graduacao"), table_name="policiais_militares")
    op.drop_index(op.f("ix_policiais_militares_nome_completo"), table_name="policiais_militares")
    op.drop_index(op.f("ix_policiais_militares_matricula"), table_name="policiais_militares")
    op.drop_table("policiais_militares")
    op.drop_index(op.f("ix_usuarios_email"), table_name="usuarios")
    op.drop_table("usuarios")
