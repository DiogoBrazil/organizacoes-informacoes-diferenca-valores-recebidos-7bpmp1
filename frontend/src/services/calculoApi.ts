import type { Calculo, CalculoIn } from "../types";
import { api } from "./api";

export async function getCalculo(requerimentoId: string) {
  const { data } = await api.get<Calculo>(`/requerimentos/${requerimentoId}/calculo`);
  return data;
}

export async function simularCalculo(requerimentoId: string, payload: CalculoIn) {
  const { data } = await api.post<Calculo>(
    `/requerimentos/${requerimentoId}/calculo/simular`,
    payload
  );
  return data;
}

export async function salvarCalculo(requerimentoId: string, payload: CalculoIn) {
  const { data } = await api.put<Calculo>(
    `/requerimentos/${requerimentoId}/calculo`,
    payload
  );
  return data;
}

export async function excluirCalculo(requerimentoId: string) {
  await api.delete(`/requerimentos/${requerimentoId}/calculo`);
}

function nomeArquivoDaResposta(
  contentDisposition: string | undefined,
  fallback: string
) {
  if (!contentDisposition) return fallback;
  const utf8 = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) return decodeURIComponent(utf8[1]);
  const simples = contentDisposition.match(/filename="?([^";]+)"?/i);
  return simples ? simples[1] : fallback;
}

// Baixa a planilha oficial (modelo CP9) em .ods gerada no backend a partir do
// template (exige cálculo salvo).
export async function baixarOdsCalculo(requerimentoId: string) {
  const response = await api.get(
    `/requerimentos/${requerimentoId}/calculo/export.ods`,
    { responseType: "blob" }
  );
  const nome = nomeArquivoDaResposta(
    response.headers["content-disposition"],
    "calculo_diferenca.ods"
  );
  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Os campos Decimal chegam da API como string (precisão plena); coagimos para
// número antes de formatar.
export function formatBRL(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatFator(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}
