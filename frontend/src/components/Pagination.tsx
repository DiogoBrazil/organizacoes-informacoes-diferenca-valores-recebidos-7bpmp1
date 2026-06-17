import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  total: number;
  perPage?: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  total,
  perPage = 10,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="focus-ring inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </button>
      <span className="font-semibold text-gov-muted">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="focus-ring inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
