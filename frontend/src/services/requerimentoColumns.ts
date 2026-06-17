import type { Requerimento } from "../types";

export interface RequerimentoReportColumn {
  header: string;
  value: (item: Requerimento, index: number) => string | number;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`));
}

function simNao(value: boolean) {
  return value ? "SIM" : "NÃO";
}

function text(value: string | null | undefined) {
  return value ?? "";
}

export const requerimentoReportColumns: RequerimentoReportColumn[] = [
  { header: "Ordem", value: (_item, index) => index + 1 },
  { header: "Processo SEI", value: (item) => item.num_processo_sei_requerimento },
  { header: "Data de Recebimento", value: (item) => formatDate(item.data_recebimento_opm) },
  { header: "Nome", value: (item) => item.policial.nome_completo },
  { header: "RE", value: (item) => item.policial.matricula },
  { header: "Nº Certidão SEI", value: (item) => item.num_sei_certidao_opm },
  { header: "Afastamentos Registrados", value: (item) => simNao(item.tem_afastamentos) },
  {
    header: "Gozou Todas Férias últimos 5 anos",
    value: (item) => simNao(item.gozou_ferias_5_anos),
  },
  { header: "Prioridade", value: (item) => simNao(item.tem_prioridade_legal) },
  { header: "Abono Pecuniario 2021", value: (item) => text(item.abono_pecuniario_2021) },
  { header: "1/3 ferias 2021", value: (item) => text(item.ferias_1_3_2021) },
  { header: "Abono Pecuniario 2022", value: (item) => text(item.abono_pecuniario_2022) },
  { header: "1/3 ferias 2022", value: (item) => text(item.ferias_1_3_2022) },
  { header: "Abono Pecuniario 2023", value: (item) => text(item.abono_pecuniario_2023) },
  { header: "1/3 ferias 2023", value: (item) => text(item.ferias_1_3_2023) },
  { header: "Abono Pecuniario 2024", value: (item) => text(item.abono_pecuniario_2024) },
  { header: "1/3 ferias 2024", value: (item) => text(item.ferias_1_3_2024) },
  { header: "Abono Pecuniario 2025", value: (item) => text(item.abono_pecuniario_2025) },
  { header: "1/3 ferias 2025", value: (item) => text(item.ferias_1_3_2025) },
  { header: "Auxilio Saúde 2021", value: (item) => text(item.auxilio_saude_2021) },
  { header: "Auxilio Saúde 2022", value: (item) => text(item.auxilio_saude_2022) },
  { header: "Auxilio Saúde 2023", value: (item) => text(item.auxilio_saude_2023) },
  { header: "Auxilio Saúde 2024", value: (item) => text(item.auxilio_saude_2024) },
  { header: "Auxilio Saúde 2025", value: (item) => text(item.auxilio_saude_2025) },
  { header: "Auxilio Saúde 2026", value: (item) => text(item.auxilio_saude_2026) },
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
