"""Dados canônicos de parâmetros e índices extraídos da planilha oficial CP9.

Fonte única usada pela migration de seed e pelos testes. Em runtime, o sistema lê
esses valores do banco (tabelas ``parametros_auxilio`` e ``indices_correcao``),
permitindo atualização por novas migrations sem alterar cálculos já congelados.
"""

from decimal import Decimal

# Auxílio saúde (50,00) e condicional (150,00) constantes em 2021-2026.
AUX_SAUDE = Decimal("50.00")
AUX_SAUDE_CONDICIONAL = Decimal("150.00")


def auxilio_alimentacao(ano: int, mes: int) -> Decimal:
    """Auxílio alimentação por competência (aba "Parâmetros Auxílios")."""
    if ano == 2021:
        return Decimal("252.50")
    if ano == 2022:
        if mes == 1:
            return Decimal("272.70")
        if mes == 2:
            return Decimal("304.06")
        return Decimal("316.23")
    if ano == 2023:
        return Decimal("316.23")
    return Decimal("253.46")  # 2024, 2025, 2026


# Série IPCA-E (IPCA-15 mensal), percentual decimal, 01/2021..05/2026.
INDICES_IPCA_E: list[tuple[int, int, str]] = [
    (2021, 1, "0.0078"), (2021, 2, "0.0048"), (2021, 3, "0.0093"), (2021, 4, "0.0060"),
    (2021, 5, "0.0044"), (2021, 6, "0.0083"), (2021, 7, "0.0072"), (2021, 8, "0.0089"),
    (2021, 9, "0.0114"), (2021, 10, "0.0120"), (2021, 11, "0.0117"), (2021, 12, "0.0078"),
    (2022, 1, "0.0058"), (2022, 2, "0.0099"), (2022, 3, "0.0095"), (2022, 4, "0.0173"),
    (2022, 5, "0.0059"), (2022, 6, "0.0069"), (2022, 7, "0.0013"), (2022, 8, "-0.0073"),
    (2022, 9, "-0.0037"), (2022, 10, "0.0016"), (2022, 11, "0.0053"), (2022, 12, "0.0052"),
    (2023, 1, "0.0055"), (2023, 2, "0.0076"), (2023, 3, "0.0069"), (2023, 4, "0.0057"),
    (2023, 5, "0.0051"), (2023, 6, "0.0004"), (2023, 7, "-0.0007"), (2023, 8, "0.0028"),
    (2023, 9, "0.0035"), (2023, 10, "0.0021"), (2023, 11, "0.0033"), (2023, 12, "0.0040"),
    (2024, 1, "0.0031"), (2024, 2, "0.0078"), (2024, 3, "0.0036"), (2024, 4, "0.0021"),
    (2024, 5, "0.0044"), (2024, 6, "0.0039"), (2024, 7, "0.0030"), (2024, 8, "0.0019"),
    (2024, 9, "0.0013"), (2024, 10, "0.0054"), (2024, 11, "0.0062"), (2024, 12, "0.0034"),
    (2025, 1, "0.0011"), (2025, 2, "0.0123"), (2025, 3, "0.0064"), (2025, 4, "0.0043"),
    (2025, 5, "0.0036"), (2025, 6, "0.0026"), (2025, 7, "0.0033"), (2025, 8, "-0.0014"),
    (2025, 9, "0.0048"), (2025, 10, "0.0018"), (2025, 11, "0.0020"), (2025, 12, "0.0025"),
    (2026, 1, "0.0020"), (2026, 2, "0.0084"), (2026, 3, "0.0044"), (2026, 4, "0.0089"),
    (2026, 5, "0.0062"),
]


def parametros_seed_rows() -> list[dict]:
    """72 linhas (ano×mês, 2021-01..2026-12) para o seed de parâmetros."""
    return [
        {
            "ano": ano,
            "mes": mes,
            "auxilio_alimentacao": auxilio_alimentacao(ano, mes),
            "auxilio_saude": AUX_SAUDE,
            "auxilio_saude_condicional": AUX_SAUDE_CONDICIONAL,
        }
        for ano in range(2021, 2027)
        for mes in range(1, 13)
    ]


def indices_seed_rows() -> list[dict]:
    """65 linhas (01/2021..05/2026) para o seed de índices IPCA-E."""
    return [
        {"ano": ano, "mes": mes, "percentual_mensal": Decimal(perc)}
        for ano, mes, perc in INDICES_IPCA_E
    ]


def parametros_map() -> dict[tuple[int, int], tuple[Decimal, Decimal, Decimal]]:
    """Mapa (ano, mês) -> (alimentação, saúde, condicional)."""
    return {
        (r["ano"], r["mes"]): (
            r["auxilio_alimentacao"],
            r["auxilio_saude"],
            r["auxilio_saude_condicional"],
        )
        for r in parametros_seed_rows()
    }


def indices_map() -> dict[tuple[int, int], Decimal]:
    """Mapa (ano, mês) -> percentual mensal."""
    return {(r["ano"], r["mes"]): r["percentual_mensal"] for r in indices_seed_rows()}
