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
