import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import type { PostoGraduacao, Requerimento } from "../types";
import {
  requerimentoReportBody,
  requerimentoReportColumns,
  requerimentoReportRows,
} from "./requerimentoColumns";

function todayForFile() {
  return new Date().toISOString().slice(0, 10);
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

export function exportRequerimentosExcel(posto: PostoGraduacao, requerimentos: Requerimento[]) {
  const worksheet = XLSX.utils.json_to_sheet(requerimentoReportRows(requerimentos), {
    header: requerimentoReportColumns.map((column) => column.header),
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Requerimentos");
  XLSX.writeFile(workbook, `requerimentos_${posto.replace(/\s+/g, "_")}_${todayForFile()}.xlsx`);
}
