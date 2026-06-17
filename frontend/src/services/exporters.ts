import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import type { PostoGraduacao, Requerimento } from "../types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`));
}

function simNao(value: boolean) {
  return value ? "SIM" : "NÃO";
}

function rows(requerimentos: Requerimento[]) {
  return requerimentos.map((item, index) => ({
    Ordem: index + 1,
    "Nº Processo SEI": item.num_processo_sei_requerimento,
    "Data Recebimento OPM": formatDate(item.data_recebimento_opm),
    Matrícula: item.policial.matricula,
    "Nome do Requerente": item.policial.nome_completo,
    "Nº SEI Certidão": item.num_sei_certidao_opm,
    Afastamentos: simNao(item.tem_afastamentos),
    "Gozou Férias 5 Anos": simNao(item.gozou_ferias_5_anos),
    "Prioridade Legal": simNao(item.tem_prioridade_legal),
    "Abono Pecuniário 2021": item.abono_pecuniario_2021 ?? "",
    "1/3 de Férias 2021": item.ferias_1_3_2021 ?? "",
  }));
}

function todayForFile() {
  return new Date().toISOString().slice(0, 10);
}

export function exportRequerimentosPdf(posto: PostoGraduacao, requerimentos: Requerimento[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(13);
  doc.text("POLÍCIA MILITAR DO ESTADO DE RONDÔNIA — PMRO", 14, 16);
  doc.setFontSize(10);
  doc.text(`Lista de Requerimentos — ${posto}`, 14, 23);
  doc.text(`Data de geração: ${new Intl.DateTimeFormat("pt-BR").format(new Date())}`, 14, 30);

  const data = rows(requerimentos);
  autoTable(doc, {
    head: [Object.keys(data[0] ?? { Ordem: "" })],
    body: data.map((row) => Object.values(row)),
    startY: 36,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [19, 81, 180] },
  });

  doc.save(`requerimentos_${posto.replace(/\s+/g, "_")}_${todayForFile()}.pdf`);
}

export function exportRequerimentosExcel(posto: PostoGraduacao, requerimentos: Requerimento[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows(requerimentos));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Requerimentos");
  XLSX.writeFile(workbook, `requerimentos_${posto.replace(/\s+/g, "_")}_${todayForFile()}.xlsx`);
}
