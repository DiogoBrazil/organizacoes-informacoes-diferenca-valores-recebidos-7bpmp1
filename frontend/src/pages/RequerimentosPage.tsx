import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { POSTOS_GRADUACOES } from "../types";

export default function RequerimentosPage() {
  const [contadores, setContadores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await api.get<Record<string, number>>("/requerimentos/contadores");
        setContadores(data);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      } finally {
        setLoading(false);
      }
    }
    void carregar();
  }, [showToast]);

  return (
    <>
      <PageHeader
        title="Requerimentos"
        subtitle="Selecione o posto ou graduação para consultar os processos recebidos."
      />
      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POSTOS_GRADUACOES.map((posto) => (
            <Link
              key={posto}
              to={`/requerimentos/${encodeURIComponent(posto)}`}
              className="focus-ring rounded border border-slate-200 bg-white p-4 shadow-sm transition hover:border-gov-secondary hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <FileText className="h-7 w-7 text-gov-primary" />
                <span className="rounded bg-blue-50 px-2 py-1 text-sm font-bold text-gov-primary">
                  {contadores[posto] ?? 0}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{posto}</h3>
              <p className="mt-1 text-sm text-gov-muted">Requerimentos cadastrados</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
