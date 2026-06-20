import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";

import logo7Bpm from "../assets/images/logo-7bpm.png";
import type { Calculo, PostoGraduacao, Requerimento } from "../types";
import {
  currencyWithSymbol,
  displayText,
  formatDate,
  formatTime,
  requerimentoReportBody,
  requerimentoReportColumns,
  simNao,
} from "./requerimentoColumns";

type ExcelCell = XLSX.CellObject & { s?: XLSX.CellStyle };
type ExcelWorksheet = XLSX.WorkSheet & {
  "!cols"?: Array<{ wch: number }>;
  "!freeze"?: { xSplit?: number; ySplit?: number; topLeftCell?: string; activePane?: string };
};

function todayForFile() {
  return new Date().toISOString().slice(0, 10);
}

function safeFileName(value: string) {
  return value.replace(/[^\w.-]+/g, "_");
}

function postoForFile(value: PostoGraduacao) {
  return value.replace(/\s+/g, "_");
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function imageUrlToDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Não foi possível carregar o logo para o PDF.");
  }
  return readBlobAsDataUrl(await response.blob());
}

export async function exportRequerimentosPdf(
  posto: PostoGraduacao,
  requerimentos: Requerimento[]
) {
  const doc = new jsPDF({ orientation: "landscape", format: "a3" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const logoDataUrl = await imageUrlToDataUrl(logo7Bpm);
  const generatedAt = new Intl.DateTimeFormat("pt-BR").format(new Date());

  doc.addImage(logoDataUrl, "PNG", centerX - 11, 8, 22, 22);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("BATALHÃO CAPITÃO SILVIO - 7ºBPM", centerX, 38, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    `Lista de Requerimentos de recálculo de valores recebidos — ${posto}`,
    centerX,
    45,
    { align: "center" }
  );

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(`Data de geração: ${generatedAt}`, centerX, 51, { align: "center" });

  doc.setDrawColor(19, 81, 180);
  doc.setLineWidth(0.6);
  doc.line(14, 55, pageWidth - 14, 55);

  autoTable(doc, {
    head: [requerimentoReportColumns.map((column) => column.header)],
    body: requerimentoReportBody(requerimentos),
    startY: 60,
    margin: { left: 8, right: 8 },
    theme: "grid",
    styles: {
      fontSize: 4,
      cellPadding: 1,
      halign: "center",
      valign: "middle",
      overflow: "linebreak",
      lineColor: [148, 163, 184],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [19, 81, 180],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      lineColor: [148, 163, 184],
      lineWidth: 0.1,
    },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 26 },
      4: { cellWidth: 38, halign: "left" },
      6: { cellWidth: 28 },
    },
    didDrawPage: (data) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Página ${data.pageNumber}`, pageWidth - 14, pageHeight - 6, {
        align: "right",
      });
    },
  });

  doc.save(`requerimentos_${postoForFile(posto)}_${todayForFile()}.pdf`);
}

function addPdfSection(
  doc: jsPDF,
  title: string,
  body: Array<[string, string | number]>,
  startY: number
) {
  doc.setFontSize(11);
  doc.setTextColor(19, 81, 180);
  doc.text(title, 14, startY);

  autoTable(doc, {
    body,
    startY: startY + 4,
    margin: { left: 14, right: 14 },
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
      valign: "middle",
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: "bold", textColor: [71, 85, 105], fillColor: [248, 250, 252] },
      1: { textColor: [15, 23, 42] },
    },
  });

  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY;
}

function addPdfTable(
  doc: jsPDF,
  title: string,
  head: string[],
  body: Array<Array<string | number>>,
  startY: number
) {
  doc.setFontSize(11);
  doc.setTextColor(19, 81, 180);
  doc.text(title, 14, startY);

  autoTable(doc, {
    head: [head],
    body,
    startY: startY + 4,
    margin: { left: 14, right: 14 },
    theme: "grid",
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      halign: "center",
      valign: "middle",
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [19, 81, 180],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
  });

  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY;
}

export async function exportRequerimentoIndividualPdf(requerimento: Requerimento) {
  const doc = new jsPDF({ orientation: "portrait", format: "a4" });
  const logoDataUrl = await imageUrlToDataUrl(logo7Bpm);
  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  doc.addImage(logoDataUrl, "PNG", 14, 10, 24, 24);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text("POLÍCIA MILITAR DO ESTADO DE RONDÔNIA - PMRO", 44, 16);
  doc.setFontSize(10);
  doc.text("7º BPMP1 - Gestão de requerimentos sobre recálculo de valores recebidos", 44, 23);
  doc.setTextColor(71, 85, 105);
  doc.text(`Gerado em: ${generatedAt}`, 44, 30);
  doc.setDrawColor(19, 81, 180);
  doc.setLineWidth(0.6);
  doc.line(14, 39, 196, 39);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text("Requerimento Individual", 14, 49);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Processo SEI: ${requerimento.num_processo_sei_requerimento}`, 14, 55);

  let y = 66;
  y = addPdfSection(
    doc,
    "Identificação do Processo",
    [
      ["Processo SEI", requerimento.num_processo_sei_requerimento],
      ["Data de Recebimento", formatDate(requerimento.data_recebimento_opm)],
      ["Hora de Recebimento", formatTime(requerimento.hora_recebimento_opm)],
      ["Nº Certidão SEI", requerimento.num_sei_certidao_opm],
    ],
    y
  );

  y = addPdfSection(
    doc,
    "Dados do Policial",
    [
      ["Posto/Graduação", requerimento.policial.posto_graduacao],
      ["Nome", requerimento.policial.nome_completo],
      ["RE", requerimento.policial.matricula],
      ["OPM", requerimento.policial.opm],
    ],
    y + 10
  );

  y = addPdfSection(
    doc,
    "Situação Funcional",
    [
      ["Afastamentos Registrados", simNao(requerimento.tem_afastamentos)],
      ["Gozou Todas Férias últimos 5 anos", simNao(requerimento.gozou_ferias_5_anos)],
      ["Prioridade", simNao(requerimento.tem_prioridade_legal)],
    ],
    y + 10
  );

  y = addPdfTable(
    doc,
    "Abono Pecuniario e 1/3 ferias por ano",
    ["Ano", "Abono Pecuniario", "1/3 ferias"],
    [2021, 2022, 2023, 2024, 2025].map((ano) => [
      ano,
      displayText(requerimento[`abono_pecuniario_${ano}` as keyof Requerimento] as string | null),
      displayText(requerimento[`ferias_1_3_${ano}` as keyof Requerimento] as string | null),
    ]),
    y + 10
  );

  addPdfTable(
    doc,
    "Auxilio Saúde por ano",
    ["Ano", "Valor"],
    [2021, 2022, 2023, 2024, 2025, 2026].map((ano) => [
      ano,
      currencyWithSymbol(requerimento[`auxilio_saude_${ano}` as keyof Requerimento] as string | null),
    ]),
    y + 10
  );

  doc.save(`requerimento_${safeFileName(requerimento.num_processo_sei_requerimento)}.pdf`);
}

const thinBorder: NonNullable<XLSX.CellStyle["border"]> = {
  top: { style: "thin", color: { rgb: "CBD5E1" } },
  right: { style: "thin", color: { rgb: "CBD5E1" } },
  bottom: { style: "thin", color: { rgb: "CBD5E1" } },
  left: { style: "thin", color: { rgb: "CBD5E1" } },
};

const headerStyle: XLSX.CellStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "1351B4" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: thinBorder,
};

const bodyStyle: XLSX.CellStyle = {
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: thinBorder,
};

const textBodyStyle: XLSX.CellStyle = {
  alignment: { horizontal: "left", vertical: "center", wrapText: true },
  border: thinBorder,
};

const zebraStyle: XLSX.CellStyle = {
  ...bodyStyle,
  fill: { fgColor: { rgb: "F8FAFC" } },
};

const zebraTextStyle: XLSX.CellStyle = {
  ...textBodyStyle,
  fill: { fgColor: { rgb: "F8FAFC" } },
};

// Larguras de coluna calculadas pelo conteúdo: o cabeçalho quebra linha
// (wrapText), então limitamos a influência dele para não alargar demais.
function computeColumnWidths(headers: string[], dataRows: Array<Array<string | number>>) {
  const MIN_WIDTH = 8;
  const MAX_WIDTH = 42;
  const HEADER_CAP = 16;
  return headers.map((header, column) => {
    let widest = Math.min(header.length, HEADER_CAP);
    for (const row of dataRows) {
      const length = String(row[column] ?? "").length;
      if (length > widest) widest = length;
    }
    return { wch: Math.min(Math.max(widest + 2, MIN_WIDTH), MAX_WIDTH) };
  });
}

function setCellStyle(worksheet: ExcelWorksheet, address: string, style: XLSX.CellStyle) {
  const cell = worksheet[address] as ExcelCell | undefined;
  if (cell) {
    cell.s = style;
  }
}

function styleRange(
  worksheet: ExcelWorksheet,
  range: XLSX.Range,
  styleForCell: (row: number, column: number) => XLSX.CellStyle
) {
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      setCellStyle(worksheet, XLSX.utils.encode_cell({ r: row, c: column }), styleForCell(row, column));
    }
  }
}

export function exportRequerimentosExcel(posto: PostoGraduacao, requerimentos: Requerimento[]) {
  const headers = requerimentoReportColumns.map((column) => column.header);
  const dataRows = requerimentos.map((item, index) =>
    requerimentoReportColumns.map((column) => column.value(item, index))
  );
  const sheetRows = [headers, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows) as ExcelWorksheet;
  const lastColumn = headers.length - 1;
  const headerRow = 0;
  const firstDataRow = 1;
  const lastDataRow = dataRows.length;

  worksheet["!cols"] = computeColumnWidths(headers, dataRows);
  worksheet["!rows"] = [{ hpt: 40 }];
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRow, c: 0 },
      e: { r: Math.max(headerRow, lastDataRow), c: lastColumn },
    }),
  };
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" };

  styleRange(
    worksheet,
    { s: { r: headerRow, c: 0 }, e: { r: headerRow, c: lastColumn } },
    () => headerStyle
  );
  if (dataRows.length) {
    styleRange(
      worksheet,
      { s: { r: firstDataRow, c: 0 }, e: { r: lastDataRow, c: lastColumn } },
      (row, column) => {
        const textColumn = column === 1 || column === 4 || column === 6 || column === 8;
        const zebra = row % 2 === 0;
        if (textColumn) return zebra ? zebraTextStyle : textBodyStyle;
        return zebra ? zebraStyle : bodyStyle;
      }
    );
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Requerimentos");
  XLSX.writeFile(workbook, `requerimentos_${postoForFile(posto)}_${todayForFile()}.xlsx`);
}

// ---- Exportação do cálculo de diferenças -----------------------------------
// Campos Decimal chegam da API como string; coagimos para número ao formatar.
function brl(value: number | string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fator8(value: number | string) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

function pct(value: number | string) {
  return `${Math.round(Number(value) * 100)}%`;
}

function mesAno(isoDate: string) {
  const [ano, mes] = isoDate.split("-");
  return `${mes}/${ano}`;
}

function calculoFileBase(requerimento: Requerimento) {
  return safeFileName(
    `calculo_${requerimento.policial.matricula}_${requerimento.policial.nome_completo}`
  );
}

const ANOS_AFASTAMENTO = [2021, 2022, 2023, 2024, 2025, 2026] as const;

export async function exportCalculoPdf(requerimento: Requerimento, calculo: Calculo) {
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoDataUrl = await imageUrlToDataUrl(logo7Bpm);
  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  doc.addImage(logoDataUrl, "PNG", 14, 10, 22, 22);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("POLÍCIA MILITAR DO ESTADO DE RONDÔNIA - PMRO", 42, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Cálculo de diferenças — abono pecuniário, 1/3 de férias e 13º",
    42,
    24
  );
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text(`Gerado em: ${generatedAt}`, 42, 30);
  doc.setDrawColor(19, 81, 180);
  doc.setLineWidth(0.6);
  doc.line(14, 35, pageWidth - 14, 35);

  let y = addPdfSection(
    doc,
    "Identificação",
    [
      ["Nome", requerimento.policial.nome_completo],
      ["Posto/Graduação", requerimento.policial.posto_graduacao],
      ["Matrícula", requerimento.policial.matricula],
      ["OPM", requerimento.policial.opm],
      ["Processo SEI", requerimento.num_processo_sei_requerimento],
      [
        "Recebimento OPM",
        `${formatDate(requerimento.data_recebimento_opm)} ${formatTime(
          requerimento.hora_recebimento_opm
        )}`,
      ],
      ["Data-base da correção", formatDate(calculo.data_base_correcao)],
      ["Limite de prescrição (5 anos)", formatDate(calculo.data_limite_prescricao)],
      ["Planilha de referência", calculo.versao_planilha],
    ],
    42
  );

  y = addPdfTable(
    doc,
    "Lançamentos",
    [
      "#",
      "Data",
      "Evento",
      "Aux. saúde",
      "Base",
      "Fator IPCA-E",
      "Dif. original",
      "% aplic.",
      "Dif. ajustada",
      "Corrigido",
      "Prescrito",
    ],
    calculo.lancamentos.map((l) => [
      l.ordem,
      formatDate(l.data_recebido),
      l.tipo_evento,
      l.tipo_auxilio_saude,
      brl(l.base_complementar),
      fator8(l.fator_correcao),
      brl(l.diferenca_original),
      pct(l.percentual_aplicavel),
      brl(l.diferenca_ajustada),
      l.prescrito ? "---" : brl(l.valor_corrigido_ajustado),
      l.prescrito ? "SIM" : "NÃO",
    ]),
    y + 8
  );

  if (calculo.afastamentos.length) {
    y = addPdfTable(
      doc,
      "Afastamentos",
      ["Modalidade", "Início", "Fim", "Avos por ano", "Observação"],
      calculo.afastamentos.map((a) => [
        a.modalidade,
        formatDate(a.data_inicio),
        formatDate(a.data_fim),
        ANOS_AFASTAMENTO.filter((ano) => (a.avos_por_ano[ano] ?? 0) > 0)
          .map((ano) => `${ano}: ${a.avos_por_ano[ano]}`)
          .join("  ") || "-",
        a.observacao,
      ]),
      y + 8
    );
  }

  y = addPdfTable(
    doc,
    "Resumo por evento",
    [
      "Evento",
      "Ano",
      "Data evento",
      "Tipo aux. saúde",
      "Base",
      "Fator IPCA-E",
      "Dif. ajustada",
      "Dif. corrigida",
    ],
    calculo.resumo.map((r) => [
      r.tipo_evento,
      r.ano,
      r.data_evento ? formatDate(r.data_evento) : "-",
      r.tipo_auxilio_saude || "-",
      brl(r.base_complementar),
      fator8(r.fator_correcao),
      r.prescrito ? "Prescrito" : brl(r.diferenca_ajustada),
      r.prescrito ? "---" : brl(r.diferenca_corrigida),
    ]),
    y + 8
  );

  addPdfSection(
    doc,
    "Totais a receber (corrigidos pelo IPCA-E)",
    [
      ["Total Abono", brl(calculo.total_abono_corrigido)],
      ["Total 1/3 Férias", brl(calculo.total_terco_ferias_corrigido)],
      ["Total 13º", brl(calculo.total_decimo_terceiro_corrigido)],
      ["Total geral a receber", brl(calculo.total_geral_a_receber)],
    ],
    y + 8
  );

  doc.save(`${calculoFileBase(requerimento)}.pdf`);
}

function styledSheet(
  headers: string[],
  dataRows: Array<Array<string | number>>,
  textColumns: number[] = []
): ExcelWorksheet {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]) as ExcelWorksheet;
  const lastColumn = headers.length - 1;
  worksheet["!cols"] = computeColumnWidths(headers, dataRows);
  worksheet["!rows"] = [{ hpt: 32 }];
  styleRange(worksheet, { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } }, () => headerStyle);
  if (dataRows.length) {
    styleRange(
      worksheet,
      { s: { r: 1, c: 0 }, e: { r: dataRows.length, c: lastColumn } },
      (row, column) => {
        const isText = textColumns.includes(column);
        const zebra = row % 2 === 0;
        if (isText) return zebra ? zebraTextStyle : textBodyStyle;
        return zebra ? zebraStyle : bodyStyle;
      }
    );
  }
  return worksheet;
}

export function exportCalculoExcel(requerimento: Requerimento, calculo: Calculo) {
  const lancHeaders = [
    "#",
    "Data recebida",
    "Evento",
    "Tipo aux. saúde",
    "Aux. alimentação",
    "Aux. saúde aplicável",
    "Base complementar",
    "Avos 13º",
    "Dif. 1/3 férias",
    "Dif. abono",
    "Dif. 13º",
    "Diferença original",
    "Competência",
    "Fator IPCA-E",
    "Corrigido original",
    "% aplicável",
    "Diferença ajustada",
    "Corrigido ajustado",
    "Afastamento reflexo",
    "Prescrito",
    "Motivo",
  ];
  const lancRows = calculo.lancamentos.map((l) => [
    l.ordem,
    formatDate(l.data_recebido),
    l.tipo_evento,
    l.tipo_auxilio_saude,
    brl(l.valor_auxilio_alimentacao),
    brl(l.valor_auxilio_saude_aplicavel),
    brl(l.base_complementar),
    Number(l.avos_13),
    brl(l.diferenca_terco_ferias),
    brl(l.diferenca_abono),
    brl(l.diferenca_13),
    brl(l.diferenca_original),
    mesAno(l.competencia_correcao),
    fator8(l.fator_correcao),
    brl(l.valor_corrigido_original),
    pct(l.percentual_aplicavel),
    brl(l.diferenca_ajustada),
    l.prescrito ? "---" : brl(l.valor_corrigido_ajustado),
    l.tem_afastamento_reflexo ? "SIM" : "NÃO",
    l.prescrito ? "SIM" : "NÃO",
    l.motivo_ajuste,
  ]);

  const afastHeaders = [
    "Modalidade",
    "Início",
    "Fim",
    ...ANOS_AFASTAMENTO.map((ano) => `Avos ${ano}`),
    "Observação",
  ];
  const afastRows = calculo.afastamentos.map((a) => [
    a.modalidade,
    formatDate(a.data_inicio),
    formatDate(a.data_fim),
    ...ANOS_AFASTAMENTO.map((ano) => a.avos_por_ano[ano] ?? 0),
    a.observacao,
  ]);

  const resumoHeaders = [
    "Evento",
    "Ano",
    "Data evento",
    "Tipo aux. saúde",
    "Aux. saúde",
    "Aux. alimentação",
    "Base",
    "Avos 13º",
    "Fator IPCA-E",
    "Diferença ajustada",
    "Diferença corrigida",
    "Prescrito",
  ];
  const resumoRows: Array<Array<string | number>> = calculo.resumo.map((r) => [
    r.tipo_evento,
    r.ano,
    r.data_evento ? formatDate(r.data_evento) : "-",
    r.tipo_auxilio_saude || "-",
    brl(r.valor_auxilio_saude),
    brl(r.valor_auxilio_alimentacao),
    brl(r.base_complementar),
    Number(r.avos_13),
    fator8(r.fator_correcao),
    r.prescrito ? "Prescrito" : brl(r.diferenca_ajustada),
    r.prescrito ? "---" : brl(r.diferenca_corrigida),
    r.prescrito ? "SIM" : "NÃO",
  ]);
  resumoRows.push([]);
  resumoRows.push(["Total Abono", "", "", "", "", "", "", "", "", "", brl(calculo.total_abono_corrigido), ""]);
  resumoRows.push(["Total 1/3 Férias", "", "", "", "", "", "", "", "", "", brl(calculo.total_terco_ferias_corrigido), ""]);
  resumoRows.push(["Total 13º", "", "", "", "", "", "", "", "", "", brl(calculo.total_decimo_terceiro_corrigido), ""]);
  resumoRows.push(["Total geral a receber", "", "", "", "", "", "", "", "", "", brl(calculo.total_geral_a_receber), ""]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    styledSheet(lancHeaders, lancRows, [2, 3, 12, 20]),
    "Lançamentos"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    styledSheet(afastHeaders, afastRows, [0, afastHeaders.length - 1]),
    "Afastamentos"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    styledSheet(resumoHeaders, resumoRows, [0, 3]),
    "Resumo"
  );
  XLSX.writeFile(workbook, `${calculoFileBase(requerimento)}.xlsx`);
}
