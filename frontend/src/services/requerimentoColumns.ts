import type { Requerimento, TipoEvento } from "../types";

export interface RequerimentoReportColumn {
  header: string;
  value: (item: Requerimento, index: number) => string | number;
}

const MESES_ABREV = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function eventoDe(item: Requerimento, tipo: TipoEvento, ano: number) {
  return item.eventos?.find((e) => e.tipo_evento === tipo && e.ano === ano);
}

// Reconstrói o texto "mmm/aaaa" (data de pagamento) que as exportações da lista
// exibiam a partir das colunas antigas, agora derivado dos eventos.
function mesAnoEvento(item: Requerimento, tipo: TipoEvento, ano: number) {
  const evento = eventoDe(item, tipo, ano);
  if (!evento?.data_recebido) return "";
  const [yyyy, mm] = evento.data_recebido.split("-");
  return `${MESES_ABREV[Number(mm) - 1]}/${yyyy}`;
}

// Valor do auxílio saúde do ano de referência (prioridade Abono -> 1/3 -> 13º);
// para registros migrados todos compartilham o mesmo valor anual antigo.
function auxSaudeAno(item: Requerimento, ano: number) {
  for (const tipo of ["ABONO", "1/3-FÉRIAS", "13º"] as TipoEvento[]) {
    const evento = eventoDe(item, tipo, ano);
    if (evento && evento.valor_auxilio_saude !== null && evento.valor_auxilio_saude !== "") {
      return Number(evento.valor_auxilio_saude).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }
  return "";
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`));
}

export function formatTime(value: string) {
  return value?.slice(0, 8) ?? "";
}

export function formatDateTime(dateValue: string, timeValue: string) {
  return `${formatDate(dateValue)} ${formatTime(timeValue)}`;
}

export function simNao(value: boolean) {
  return value ? "SIM" : "NÃO";
}

export function text(value: string | null | undefined) {
  return value ?? "";
}

export function displayText(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

export function currencyWithSymbol(value: string | null | undefined) {
  return value ? `R$ ${value}` : "-";
}

export const requerimentoReportColumns: RequerimentoReportColumn[] = [
  { header: "Ordem", value: (_item, index) => index + 1 },
  { header: "Processo SEI", value: (item) => item.num_processo_sei_requerimento },
  { header: "Data de Recebimento", value: (item) => formatDate(item.data_recebimento_opm) },
  { header: "Hora de Recebimento", value: (item) => formatTime(item.hora_recebimento_opm) },
  { header: "Nome", value: (item) => item.policial.nome_completo },
  { header: "RE", value: (item) => item.policial.matricula },
  { header: "Nº Certidão SEI", value: (item) => item.num_sei_certidao_opm },
  { header: "Afastamentos Registrados", value: (item) => simNao(item.tem_afastamentos) },
  {
    header: "Gozou Todas Férias últimos 5 anos",
    value: (item) => simNao(item.gozou_ferias_5_anos),
  },
  { header: "Prioridade", value: (item) => simNao(item.tem_prioridade_legal) },
  { header: "Abono Pecuniario 2021", value: (item) => mesAnoEvento(item, "ABONO", 2021) },
  { header: "1/3 ferias 2021", value: (item) => mesAnoEvento(item, "1/3-FÉRIAS", 2021) },
  { header: "Abono Pecuniario 2022", value: (item) => mesAnoEvento(item, "ABONO", 2022) },
  { header: "1/3 ferias 2022", value: (item) => mesAnoEvento(item, "1/3-FÉRIAS", 2022) },
  { header: "Abono Pecuniario 2023", value: (item) => mesAnoEvento(item, "ABONO", 2023) },
  { header: "1/3 ferias 2023", value: (item) => mesAnoEvento(item, "1/3-FÉRIAS", 2023) },
  { header: "Abono Pecuniario 2024", value: (item) => mesAnoEvento(item, "ABONO", 2024) },
  { header: "1/3 ferias 2024", value: (item) => mesAnoEvento(item, "1/3-FÉRIAS", 2024) },
  { header: "Abono Pecuniario 2025", value: (item) => mesAnoEvento(item, "ABONO", 2025) },
  { header: "1/3 ferias 2025", value: (item) => mesAnoEvento(item, "1/3-FÉRIAS", 2025) },
  { header: "Auxilio Saúde 2021", value: (item) => currencyWithSymbol(auxSaudeAno(item, 2021)) },
  { header: "Auxilio Saúde 2022", value: (item) => currencyWithSymbol(auxSaudeAno(item, 2022)) },
  { header: "Auxilio Saúde 2023", value: (item) => currencyWithSymbol(auxSaudeAno(item, 2023)) },
  { header: "Auxilio Saúde 2024", value: (item) => currencyWithSymbol(auxSaudeAno(item, 2024)) },
  { header: "Auxilio Saúde 2025", value: (item) => currencyWithSymbol(auxSaudeAno(item, 2025)) },
  { header: "Auxilio Saúde 2026", value: (item) => currencyWithSymbol(auxSaudeAno(item, 2026)) },
  { header: "Enviado para CP", value: (item) => simNao(item.enviado_para_cp) },
];

export function requerimentoReportRows(requerimentos: Requerimento[]) {
  return requerimentos.map((item, index) =>
    Object.fromEntries(
      requerimentoReportColumns.map((column) => [column.header, column.value(item, index)])
    )
  );
}

export function requerimentoReportBody(requerimentos: Requerimento[]) {
  return requerimentos.map((item, index) =>
    requerimentoReportColumns.map((column) => column.value(item, index))
  );
}
