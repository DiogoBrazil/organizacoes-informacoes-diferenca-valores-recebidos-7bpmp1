"""Constantes e enums do módulo de cálculo de diferenças.

Reproduz os parâmetros fixos da planilha oficial CP9 (abas Lançamentos,
Afastamentos, Resumo e auxiliares).
"""

from datetime import date

# Versão da planilha de referência (aba Resumo).
VERSAO_PLANILHA = "CP9-V-2026.06.002"

# Data-base de correção monetária (aba Resumo / Índices Correção). A correção
# acumula da competência do evento até a última competência oficial, inclusive.
DATA_BASE_CORRECAO = date(2026, 5, 31)
ULTIMA_COMPETENCIA_OFICIAL = (2026, 5)  # (ano, mês)

# Anos civis cobertos pela planilha.
ANO_INICIAL = 2021
ANO_FINAL = 2026
ANOS = list(range(ANO_INICIAL, ANO_FINAL + 1))

# Tipos de evento (aba Lançamentos / Listas).
EVENTO_ABONO = "ABONO"
EVENTO_TERCO_FERIAS = "1/3-FÉRIAS"
EVENTO_13 = "13º"
TIPOS_EVENTO = (EVENTO_ABONO, EVENTO_TERCO_FERIAS, EVENTO_13)

# Tipos de auxílio saúde recebido no mês (aba Lançamentos / Listas).
AUX_SAUDE = "SAUDE"
AUX_CONDICIONAL = "CONDICIONAL"
TIPOS_AUX_SAUDE = (AUX_SAUDE, AUX_CONDICIONAL)

# Modalidades de afastamento.
MOD_LTIP = "LTIP"
MOD_LTSD = "LTSD"
MOD_LAC = "LAC"
MOD_DESERTOR = "DESERTOR"
MOD_PRESO = "PRESO TRANS. JULG."  # grafia oficial da fórmula da planilha
MOD_EXCLUIDO = "EXCLUÍDO"
MOD_LICENCIADO = "LICENCIADO"

# Enum completo aceito pela engine (compatibilidade com a matriz da planilha).
MODALIDADES_AFASTAMENTO = (
    MOD_LTIP,
    MOD_LTSD,
    MOD_LAC,
    MOD_DESERTOR,
    MOD_PRESO,
    MOD_EXCLUIDO,
    MOD_LICENCIADO,
)

# Modalidades oferecidas para seleção na interface (constam da aba Listas).
# LICENCIADO fica apenas como compatibilidade interna (não está na validação).
MODALIDADES_SELECIONAVEIS = (
    MOD_LTIP,
    MOD_LTSD,
    MOD_LAC,
    MOD_DESERTOR,
    MOD_PRESO,
    MOD_EXCLUIDO,
)

# Limite de avos do LTSD por ano civil: só reduz o excedente a 6 (180 dias).
LTSD_AVOS_LIVRES = 6

# Anos de prescrição quinquenal.
ANOS_PRESCRICAO = 5

# Mensagens automáticas de motivo de ajuste (aba Lançamentos, coluna Y).
MOTIVO_SEM_AFASTAMENTO = "Sem afastamento com reflexo"
MOTIVO_13_POR_AVOS = "13º calculado por avos remuneratórios da aba Afastamentos"
MOTIVO_FERIAS_BLOQUEADO = (
    "Férias/abono bloqueados se o ano civil possuir afastamento com reflexo"
)
