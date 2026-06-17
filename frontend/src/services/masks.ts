const monthAliases: Record<string, string> = {
  jan: "jan",
  fev: "fev",
  mar: "mar",
  abr: "abr",
  mai: "mai",
  jun: "jun",
  jul: "jul",
  ago: "ago",
  set: "set",
  out: "out",
  nov: "nov",
  dez: "dez",
};

export function maskSeiProcess(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const part1 = digits.slice(0, 4);
  const part2 = digits.slice(4, 10);
  const part3 = digits.slice(10, 14);
  const part4 = digits.slice(14, 16);
  let result = part1;
  if (part2) result += `.${part2}`;
  if (part3) result += `/${part3}`;
  if (part4) result += `-${part4}`;
  return result;
}

export function maskMatricula(value: string) {
  return value.replace(/\D/g, "").slice(0, 9);
}

export function maskMonthYear(value: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 7);
  const month = normalized.slice(0, 3);
  const year = normalized.slice(3, 7);
  if (!year) return month;
  return `${month}/${year}`;
}

export function normalizeMonthYear(value: string) {
  const masked = maskMonthYear(value);
  const [month, year] = masked.split("/");
  if (month?.length === 3 && year?.length === 4 && monthAliases[month]) {
    return `${monthAliases[month]}/${year}`;
  }
  return masked;
}

export function normalizeCurrency(value: string) {
  const normalized = value.replace(/[^\d,]/g, "").replace(",", ".");
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount)) return "";
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function currencyWithSymbol(value: string | null | undefined) {
  if (!value) return "-";
  return `R$ ${value}`;
}

export function parseTotalCount(value: string | null) {
  const total = Number(value ?? 0);
  return Number.isFinite(total) ? total : 0;
}
