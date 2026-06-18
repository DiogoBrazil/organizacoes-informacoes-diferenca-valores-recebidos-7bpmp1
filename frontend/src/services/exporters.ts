import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import logo7Bpm from "../assets/images/logo-7bpm.png";
import type { PostoGraduacao, Requerimento } from "../types";
import {
  currencyWithSymbol,
  displayText,
  formatDate,
  formatTime,
  requerimentoReportBody,
  requerimentoReportColumns,
  requerimentoReportRows,
  simNao,
} from "./requerimentoColumns";

function todayForFile() {
  return new Date().toISOString().slice(0, 10);
}

function safeFileName(value: string) {
  return value.replace(/[^\w.-]+/g, "_");
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

export function exportRequerimentosPdf(posto: PostoGraduacao, requerimentos: Requerimento[]) {
  const doc = new jsPDF({ orientation: "landscape", format: "a3" });
  doc.setFontSize(13);
  doc.text("POLÍCIA MILITAR DO ESTADO DE RONDÔNIA — PMRO", 14, 16);
  doc.setFontSize(10);
  doc.text(`Lista de Requerimentos — ${posto}`, 14, 23);
  doc.text(`Data de geração: ${new Intl.DateTimeFormat("pt-BR").format(new Date())}`, 14, 30);

  autoTable(doc, {
    head: [requerimentoReportColumns.map((column) => column.header)],
    body: requerimentoReportBody(requerimentos),
    startY: 36,
    margin: { left: 8, right: 8 },
    styles: { fontSize: 4, cellPadding: 1, halign: "center", valign: "middle" },
    columnStyles: {
      3: { cellWidth: 34 },
      7: { cellWidth: 24 },
    },
    headStyles: { fillColor: [19, 81, 180] },
  });

  doc.save(`requerimentos_${posto.replace(/\s+/g, "_")}_${todayForFile()}.pdf`);
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

export function exportRequerimentosExcel(posto: PostoGraduacao, requerimentos: Requerimento[]) {
  const worksheet = XLSX.utils.json_to_sheet(requerimentoReportRows(requerimentos), {
    header: requerimentoReportColumns.map((column) => column.header),
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Requerimentos");
  XLSX.writeFile(workbook, `requerimentos_${posto.replace(/\s+/g, "_")}_${todayForFile()}.xlsx`);
}
