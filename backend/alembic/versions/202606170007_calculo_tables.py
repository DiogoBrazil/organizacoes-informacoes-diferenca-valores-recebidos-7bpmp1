"""tabelas do calculo de diferencas (calculos, lancamentos, afastamentos)

Revision ID: 202606170007
Revises: 202606170006
Create Date: 2026-06-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "202606170007"
down_revision: str | None = "202606170006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

MONEY = sa.Numeric(18, 6)
FATOR = sa.Numeric(16, 8)


def upgrade() -> None:
    op.create_table(
        "calculos",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "requerimento_id",
            UUID(as_uuid=True),
            sa.ForeignKey("requerimentos.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("data_base_correcao", sa.Date(), nullable=False),
        sa.Column("versao_planilha", sa.String(40), nullable=False),
        sa.Column("total_abono_corrigido", MONEY, nullable=False),
        sa.Column("total_terco_ferias_corrigido", MONEY, nullable=False),
        sa.Column("total_decimo_terceiro_corrigido", MONEY, nullable=False),
        sa.Column("total_geral_a_receber", MONEY, nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "criado_por_id",
            UUID(as_uuid=True),
            sa.ForeignKey("usuarios.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "atualizado_por_id",
            UUID(as_uuid=True),
            sa.ForeignKey("usuarios.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.UniqueConstraint("requerimento_id", name="uq_calculos_requerimento"),
    )

    op.create_table(
        "calculo_lancamentos",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "calculo_id",
            UUID(as_uuid=True),
            sa.ForeignKey("calculos.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ordem", sa.Integer(), nullable=False),
        sa.Column("data_recebido", sa.Date(), nullable=False),
        sa.Column("tipo_evento", sa.String(20), nullable=False),
        sa.Column("tipo_auxilio_saude", sa.String(20), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("valor_auxilio_alimentacao", MONEY, nullable=False),
        sa.Column("valor_auxilio_saude_aplicavel", MONEY, nullable=False),
        sa.Column("base_complementar", MONEY, nullable=False),
        sa.Column("avos_13", sa.Numeric(6, 3), nullable=False),
        sa.Column("diferenca_terco_ferias", MONEY, nullable=False),
        sa.Column("diferenca_abono", MONEY, nullable=False),
        sa.Column("diferenca_13", MONEY, nullable=False),
        sa.Column("diferenca_original", MONEY, nullable=False),
        sa.Column("competencia_correcao", sa.Date(), nullable=False),
        sa.Column("fator_correcao", FATOR, nullable=False),
        sa.Column("valor_corrigido_original", MONEY, nullable=False),
        sa.Column("percentual_aplicavel", sa.Numeric(5, 4), nullable=False),
        sa.Column("diferenca_ajustada", MONEY, nullable=False),
        sa.Column("valor_corrigido_ajustado", MONEY, nullable=False),
        sa.Column("tem_afastamento_reflexo", sa.Boolean(), nullable=False),
        sa.Column("prescrito", sa.Boolean(), nullable=False),
        sa.Column("motivo_ajuste", sa.String(120), nullable=False),
    )
    op.create_index(
        "ix_calculo_lancamentos_calculo_id", "calculo_lancamentos", ["calculo_id"]
    )

    op.create_table(
        "calculo_afastamentos",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "calculo_id",
            UUID(as_uuid=True),
            sa.ForeignKey("calculos.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("modalidade", sa.String(30), nullable=False),
        sa.Column("data_inicio", sa.Date(), nullable=False),
        sa.Column("data_fim", sa.Date(), nullable=False),
        sa.Column("avos_por_ano", JSONB, nullable=False),
        sa.Column("observacao", sa.String(200), nullable=False),
    )
    op.create_index(
        "ix_calculo_afastamentos_calculo_id", "calculo_afastamentos", ["calculo_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_calculo_afastamentos_calculo_id", table_name="calculo_afastamentos")
    op.drop_table("calculo_afastamentos")
    op.drop_index("ix_calculo_lancamentos_calculo_id", table_name="calculo_lancamentos")
    op.drop_table("calculo_lancamentos")
    op.drop_table("calculos")
