import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { POSTOS_GRADUACOES, type Policial, type PostoGraduacao } from "../types";

export default function PoliciaisPage() {
  const [policiais, setPoliciais] = useState<Policial[]>([]);
  const [busca, setBusca] = useState("");
  const [posto, setPosto] = useState<PostoGraduacao | "">("");
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState<Policial | null>(null);
  const { showToast } = useToast();

  async function carregar() {
    setLoading(true);
    try {
      const { data } = await api.get<Policial[]>("/policiais");
      setPoliciais(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return policiais.filter((policial) => {
      const postoOk = posto ? policial.posto_graduacao === posto : true;
      const buscaOk = termo
        ? policial.nome_completo.toLowerCase().includes(termo) ||
          String(policial.matricula).includes(termo)
        : true;
      return postoOk && buscaOk;
    });
  }, [policiais, busca, posto]);

  async function confirmarExclusao() {
    if (!removendo) return;
    try {
      await api.delete(`/policiais/${removendo.id}`);
      showToast("Policial militar excluído com sucesso.");
      setRemovendo(null);
      await carregar();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Policiais Militares"
        subtitle="Cadastre e mantenha os dados funcionais dos requerentes."
        actions={
          <Link
            to="/policiais/novo"
            className="focus-ring inline-flex items-center gap-2 rounded bg-gov-primary px-4 py-2 text-sm font-semibold text-white hover:bg-gov-secondary"
          >
            <Plus className="h-4 w-4" />
            Adicionar Policial
          </Link>
        }
      />
      <div className="mb-4 grid gap-3 rounded border border-slate-200 bg-white p-3 md:grid-cols-[220px_1fr]">
        <select
          value={posto}
          onChange={(event) => setPosto(event.target.value as PostoGraduacao | "")}
          className="focus-ring rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Todos os postos</option>
          {POSTOS_GRADUACOES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gov-muted" />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por nome ou matrícula"
            className="focus-ring w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-100 text-gov-muted">
              <tr>
                <th className="px-4 py-3">Posto/Graduação</th>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3">Nome Completo</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((policial, index) => (
                <tr key={policial.id} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="px-4 py-3 font-semibold">{policial.posto_graduacao}</td>
                  <td className="px-4 py-3">{policial.matricula}</td>
                  <td className="px-4 py-3">{policial.nome_completo}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/policiais/${policial.id}/editar`}
                        className="focus-ring rounded p-2 text-gov-primary hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setRemovendo(policial)}
                        className="focus-ring rounded p-2 text-gov-danger hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtrados.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gov-muted">
                    Nenhum policial militar encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmModal
        open={Boolean(removendo)}
        title="Excluir policial militar"
        message={`Deseja excluir ${removendo?.nome_completo ?? "este policial"}? Os requerimentos vinculados também serão removidos.`}
        onCancel={() => setRemovendo(null)}
        onConfirm={confirmarExclusao}
      />
    </>
  );
}
