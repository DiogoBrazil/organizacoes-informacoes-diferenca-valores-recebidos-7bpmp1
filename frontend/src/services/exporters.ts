import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";

import logo7Bpm from "../assets/images/logo-7bpm.png";
import type { PostoGraduacao, Requerimento } from "../types";
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
