"""eventos do requerimento (abono/1/3/13 com data completa + auxilio saude)

Revision ID: 202606170008
Revises: 202606170007
Create Date: 2026-06-20

Substitui as colunas planas de abono/1/3 (mmm/aaaa) e auxílio saúde anual por uma
tabela filha `requerimento_evento` (Abono, 1/3-FÉRIAS, 13º; data completa + valor do
auxílio saúde por evento). Migra os dados existentes.
"""

import uuid
from collections.abc import Sequence
from datetime import date
from decimal import Decimal, InvalidOperation

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "202606170008"
down_revision: str | None = "202606170007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ANOS = range(2021, 2026)  # colunas antigas de abono/1/3 cobriam 2021-2025
MESES = {
    "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
    "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
}


def _parse_mmm_aaaa(value: str | None) -> tuple[int, int] | None:
    if not value:
        return None
    texto = str(value).strip().lower().replace("./", "/")
    partes = texto.split("/")
    if len(partes) != 2:
        return None
    mes = MESES.get(partes[0][:3])
    if not mes or not partes[1].isdigit():
        return None
    return mes, int(partes[1])


def _dia_convencao(mes: int) -> int:
    # Convenção dia 30; fevereiro usa 28 para evitar data inválida.
    return 28 if mes == 2 else 30


def _parse_valor(value: str | None) -> Decimal | None:
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value).replace(".", "").replace(",", "."))
    except (InvalidOperation, ValueError):
        return None


def upgrade() -> None:
    eventos = op.create_table(
        "requerimento_evento",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "requerimento_id",
            UUID(as_uuid=True),
            sa.ForeignKey("requerimentos.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("tipo_evento", sa.String(20), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("data_recebido", sa.Date(), nullable=False),
        sa.Column("valor_auxilio_saude", sa.Numeric(10, 2), nullable=True),
        sa.UniqueConstraint(
            "requerimento_id", "tipo_evento", "ano", name="uq_req_evento_tipo_ano"
        ),
    )
    op.create_index(
        "ix_requerimento_evento_requerimento_id", "requerimento_evento", ["requerimento_id"]
    )

    bind = op.get_bind()
    colunas = ["id"]
    for ano in ANOS:
        colunas += [f"abono_pecuniario_{ano}", f"ferias_1_3_{ano}", f"auxilio_saude_{ano}"]
    rows = bind.execute(sa.text(f"SELECT {', '.join(colunas)} FROM requerimentos")).mappings()

    # `ano` é o ano de REFERÊNCIA (o rótulo da coluna antiga). `data_recebido` é a
    # data de PAGAMENTO (mmm/aaaa do valor), cujo ano pode diferir do de referência
    # (ex.: abono referente a 2021 pago em out/2022). O valor do auxílio saúde é
    # pareado pela coluna de referência.
    novos: list[dict] = []
    for row in rows:
        for slot in ANOS:
            valor = _parse_valor(row.get(f"auxilio_saude_{slot}"))
            for tipo, coluna in (
                ("ABONO", f"abono_pecuniario_{slot}"),
                ("1/3-FÉRIAS", f"ferias_1_3_{slot}"),
            ):
                competencia = _parse_mmm_aaaa(row.get(coluna))
                if not competencia:
                    continue
                mes, ano_pagto = competencia
                novos.append(
                    {
                        "id": uuid.uuid4(),
                        "requerimento_id": row["id"],
                        "tipo_evento": tipo,
                        "ano": slot,
                        "data_recebido": date(ano_pagto, mes, _dia_convencao(mes)),
                        "valor_auxilio_saude": valor,
                    }
                )
    if novos:
        op.bulk_insert(eventos, novos)

    for ano in ANOS:
        op.drop_column("requerimentos", f"abono_pecuniario_{ano}")
        op.drop_column("requerimentos", f"ferias_1_3_{ano}")
    for ano in range(2021, 2027):
        op.drop_column("requerimentos", f"auxilio_saude_{ano}")


def downgrade() -> None:
    # Recria as colunas antigas (nullable) e faz backfill best-effort a partir dos eventos.
    for ano in ANOS:
        op.add_column("requerimentos", sa.Column(f"abono_pecuniario_{ano}", sa.String(20)))
        op.add_column("requerimentos", sa.Column(f"ferias_1_3_{ano}", sa.String(20)))
    for ano in range(2021, 2027):
        op.add_column("requerimentos", sa.Column(f"auxilio_saude_{ano}", sa.String(20)))

    inv_meses = {v: k for k, v in MESES.items()}
    bind = op.get_bind()
    eventos = bind.execute(
        sa.text(
            "SELECT requerimento_id, tipo_evento, ano, data_recebido, valor_auxilio_saude "
            "FROM requerimento_evento"
        )
    ).mappings()
    for ev in eventos:
        if ev["ano"] not in ANOS:
            continue  # 13º e anos fora de 2021-2025 não têm coluna correspondente
        data = ev["data_recebido"]
        mmm = inv_meses[data.month]
        sets = []
        params = {"rid": ev["requerimento_id"]}
        if ev["tipo_evento"] == "ABONO":
            sets.append(f"abono_pecuniario_{ev['ano']} = :v")
            params["v"] = f"{mmm}/{data.year}"
        elif ev["tipo_evento"] == "1/3-FÉRIAS":
            sets.append(f"ferias_1_3_{ev['ano']} = :v")
            params["v"] = f"{mmm}/{data.year}"
        if ev["valor_auxilio_saude"] is not None:
            valor = Decimal(ev["valor_auxilio_saude"]).quantize(Decimal("0.01"))
            sets.append(f"auxilio_saude_{ev['ano']} = :s")
            params["s"] = f"{valor:.2f}".replace(".", ",")
        if sets:
            bind.execute(
                sa.text(f"UPDATE requerimentos SET {', '.join(sets)} WHERE id = :rid"), params
            )

    op.drop_index("ix_requerimento_evento_requerimento_id", table_name="requerimento_evento")
    op.drop_table("requerimento_evento")
