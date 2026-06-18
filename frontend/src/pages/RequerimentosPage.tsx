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
        eyebrow="Por posto / graduação"
        subtitle="Selecione o posto ou graduação para consultar os processos recebidos."
        icon={FileText}
      />
      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POSTOS_GRADUACOES.map((posto) => (
            <Link
              key={posto}
              to={`/requerimentos/${encodeURIComponent(posto)}`}
              className="focus-ring group surface-card relative overflow-hidden p-4 transition-colors duration-200 hover:border-gov-primary/40 hover:shadow-card"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gov-primary transition-transform duration-200 group-hover:scale-x-100"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gov-primary/15 bg-gov-primary/10 text-gov-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-gov-primary px-2.5 py-1 text-sm font-bold tabular-nums text-white">
                  {contadores[posto] ?? 0}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-gov-text">{posto}</h3>
              <p className="mt-1 text-sm text-gov-muted">Requerimentos cadastrados</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
