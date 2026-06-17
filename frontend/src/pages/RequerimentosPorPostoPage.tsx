import { Download, Edit, Eye, FileSpreadsheet, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { exportRequerimentosExcel, exportRequerimentosPdf } from "../services/exporters";
import { parseTotalCount } from "../services/masks";
import { formatDate } from "../services/requerimentoColumns";
import { POSTOS_GRADUACOES, type PostoGraduacao, type Requerimento } from "../types";

const PER_PAGE = 10;

export default function RequerimentosPorPostoPage() {
  const params = useParams();
  const posto = decodeURIComponent(params.posto ?? "") as PostoGraduacao;
  const [requerimentos, setRequerimentos] = useState<Requerimento[]>([]);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState<Requerimento | null>(null);
  const { showToast } = useToast();
  const postoValido = POSTOS_GRADUACOES.includes(posto);

  async function carregar() {
    if (!postoValido) return;
    setLoading(true);
    try {
      const response = await api.get<Requerimento[]>("/requerimentos", {
        params: {
          posto_graduacao: posto,
          busca: busca || undefined,
          page,
          per_page: PER_PAGE,
        },
      });
      setRequerimentos(response.data);
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

  async function carregarTodosFiltrados() {
    const primeiraPagina = await api.get<Requerimento[]>("/requerimentos", {
      params: {
        posto_graduacao: posto,
        busca: busca || undefined,
        page: 1,
        per_page: PER_PAGE,
      },
    });
    const totalRegistros = parseTotalCount(primeiraPagina.headers["x-total-count"]);
    const totalPaginas = Math.max(1, Math.ceil(totalRegistros / PER_PAGE));
    const todos = [...primeiraPagina.data];
    for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
      const { data } = await api.get<Requerimento[]>("/requerimentos", {
        params: {
          posto_graduacao: posto,
          busca: busca || undefined,
          page: pagina,
          per_page: PER_PAGE,
        },
      });
      todos.push(...data);
    }
    return todos;
  }

  async function confirmarExclusao() {
    if (!removendo) return;
    try {
      await api.delete(`/requerimentos/${removendo.id}`);
      showToast("Requerimento excluído com sucesso.");
      setRemovendo(null);
      await carregar();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  async function handleExportPdf() {
    try {
      exportRequerimentosPdf(posto, await carregarTodosFiltrados());
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  async function handleExportExcel() {
    try {
      exportRequerimentosExcel(posto, await carregarTodosFiltrados());
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  if (!postoValido) {
    return <PageHeader title="Posto inválido" subtitle="Selecione um posto válido na página anterior." />;
  }

  return (
    <>
      <PageHeader
        title={posto}
        subtitle="Lista de processos de requerimento recebidos pela OPM."
        actions={
          <>
            <button
              type="button"
              onClick={handleExportPdf}
              className="focus-ring inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="focus-ring inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </button>
            <Link
              to="/requerimentos/novo"
              className="focus-ring inline-flex items-center gap-2 rounded bg-gov-primary px-4 py-2 text-sm font-semibold text-white hover:bg-gov-secondary"
            >
              <Plus className="h-4 w-4" />
              Adicionar Requerimento
            </Link>
          </>
        }
      />
      <div className="mb-4 flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-gov-muted" />
        <input
          value={busca}
          onChange={(event) => {
            setBusca(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome ou RE"
          className="focus-ring w-full border-0 bg-transparent outline-none"
        />
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[920px] border-collapse text-center text-sm">
            <thead className="bg-slate-100 text-gov-muted">
              <tr>
                <th className="border border-slate-300 px-3 py-3">Ordem</th>
                <th className="border border-slate-300 px-3 py-3">Processo SEI</th>
                <th className="border border-slate-300 px-3 py-3">Data de Recebimento</th>
                <th className="border border-slate-300 px-3 py-3">Nome</th>
                <th className="border border-slate-300 px-3 py-3">RE</th>
                <th className="border border-slate-300 px-3 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {requerimentos.map((item, index) => (
                <tr key={item.id} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="border border-slate-300 px-3 py-3 font-semibold">
                    {(page - 1) * PER_PAGE + index + 1}
                  </td>
                  <td className="border border-slate-300 px-3 py-3">{item.num_processo_sei_requerimento}</td>
                  <td className="border border-slate-300 px-3 py-3">{formatDate(item.data_recebimento_opm)}</td>
                  <td className="border border-slate-300 px-3 py-3">{item.policial.nome_completo}</td>
                  <td className="border border-slate-300 px-3 py-3">{item.policial.matricula}</td>
                  <td className="border border-slate-300 px-3 py-3 align-middle">
                    <div className="flex justify-center gap-2">
                      <Link
                        to={`/requerimentos/${item.id}/visualizar`}
                        className="focus-ring rounded p-2 text-gov-primary hover:bg-blue-50"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/requerimentos/${item.id}/editar`}
                        className="focus-ring rounded p-2 text-gov-primary hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setRemovendo(item)}
                        className="focus-ring rounded p-2 text-gov-danger hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!requerimentos.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-slate-300 px-4 py-8 text-center text-gov-muted"
                  >
                    Nenhum requerimento cadastrado para este posto.
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
        title="Excluir requerimento"
        message={`Deseja excluir o processo ${removendo?.num_processo_sei_requerimento ?? ""}?`}
        onCancel={() => setRemovendo(null)}
        onConfirm={confirmarExclusao}
      />
    </>
  );
}
