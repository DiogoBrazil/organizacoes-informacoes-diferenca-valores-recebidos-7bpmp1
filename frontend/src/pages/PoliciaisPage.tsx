import { Edit, Plus, Search, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { parseTotalCount } from "../services/masks";
import { POSTOS_GRADUACOES, type Policial, type PostoGraduacao } from "../types";

const PER_PAGE = 10;

export default function PoliciaisPage() {
  const [policiais, setPoliciais] = useState<Policial[]>([]);
  const [busca, setBusca] = useState("");
  const [posto, setPosto] = useState<PostoGraduacao | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState<Policial | null>(null);
  const { showToast } = useToast();

  async function carregar() {
    setLoading(true);
    try {
      const response = await api.get<Policial[]>("/policiais", {
        params: {
          posto_graduacao: posto || undefined,
          busca: busca || undefined,
          page,
          per_page: PER_PAGE,
        },
      });
      setPoliciais(response.data);
      setTotal(parseTotalCount(response.headers["x-total-count"]));
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [busca, page, posto]);

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
        eyebrow="Efetivo"
        subtitle="Cadastre e mantenha os dados funcionais dos requerentes."
        icon={Shield}
        actions={
          <Link to="/policiais/novo" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Adicionar Policial
          </Link>
        }
      />
      <div className="mb-4 grid gap-3 rounded border border-slate-200 bg-white p-3 md:grid-cols-[220px_1fr]">
        <select
          value={posto}
          onChange={(event) => {
            setPosto(event.target.value as PostoGraduacao | "");
            setPage(1);
          }}
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
            onChange={(event) => {
              setBusca(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou matrícula"
            className="focus-ring w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-center text-sm">
            <thead className="bg-slate-100 text-gov-muted">
              <tr>
                <th className="border border-slate-300 px-4 py-3">Posto/Graduação</th>
                <th className="border border-slate-300 px-4 py-3">Matrícula</th>
                <th className="border border-slate-300 px-4 py-3">Nome Completo</th>
                <th className="border border-slate-300 px-4 py-3">OPM</th>
                <th className="border border-slate-300 px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {policiais.map((policial, index) => (
                <tr key={policial.id} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="border border-slate-300 px-4 py-3 font-semibold">{policial.posto_graduacao}</td>
                  <td className="border border-slate-300 px-4 py-3">{policial.matricula}</td>
                  <td className="border border-slate-300 px-4 py-3">{policial.nome_completo}</td>
                  <td className="border border-slate-300 px-4 py-3">{policial.opm}</td>
                  <td className="border border-slate-300 px-4 py-3">
                    <div className="flex justify-center gap-2">
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
              {!policiais.length ? (
                <tr>
                  <td colSpan={5} className="border border-slate-300 px-4 py-8 text-center text-gov-muted">
                    Nenhum policial militar encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
      {!loading ? (
        <Pagination page={page} total={total} perPage={PER_PAGE} onPageChange={setPage} />
      ) : null}
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
