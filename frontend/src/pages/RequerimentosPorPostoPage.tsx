import { Download, Edit, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import BooleanBadge from "../components/BooleanBadge";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { exportRequerimentosExcel, exportRequerimentosPdf } from "../services/exporters";
import { POSTOS_GRADUACOES, type PostoGraduacao, type Requerimento } from "../types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`));
}

export default function RequerimentosPorPostoPage() {
  const params = useParams();
  const posto = decodeURIComponent(params.posto ?? "") as PostoGraduacao;
  const [requerimentos, setRequerimentos] = useState<Requerimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState<Requerimento | null>(null);
  const { showToast } = useToast();
  const postoValido = POSTOS_GRADUACOES.includes(posto);

  async function carregar() {
    if (!postoValido) return;
    setLoading(true);
    try {
      const { data } = await api.get<Requerimento[]>("/requerimentos", {
        params: { posto_graduacao: posto },
      });
      setRequerimentos(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [posto]);

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
              onClick={() => exportRequerimentosPdf(posto, requerimentos)}
              className="focus-ring inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={() => exportRequerimentosExcel(posto, requerimentos)}
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
      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-slate-100 text-gov-muted">
              <tr>
                <th className="px-3 py-3">Ordem</th>
                <th className="px-3 py-3">Nº Processo SEI</th>
                <th className="px-3 py-3">Data Recebimento OPM</th>
                <th className="px-3 py-3">Matrícula</th>
                <th className="px-3 py-3">Nome do Requerente</th>
                <th className="px-3 py-3">Nº SEI Certidão</th>
                <th className="px-3 py-3">Afastamentos</th>
                <th className="px-3 py-3">Férias 5 Anos</th>
                <th className="px-3 py-3">Prioridade</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {requerimentos.map((item, index) => (
                <tr key={item.id} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="px-3 py-3 font-semibold">{index + 1}</td>
                  <td className="px-3 py-3">{item.num_processo_sei_requerimento}</td>
                  <td className="px-3 py-3">{formatDate(item.data_recebimento_opm)}</td>
                  <td className="px-3 py-3">{item.policial.matricula}</td>
                  <td className="px-3 py-3">{item.policial.nome_completo}</td>
                  <td className="px-3 py-3">{item.num_sei_certidao_opm}</td>
                  <td className="px-3 py-3"><BooleanBadge value={item.tem_afastamentos} /></td>
                  <td className="px-3 py-3"><BooleanBadge value={item.gozou_ferias_5_anos} /></td>
                  <td className="px-3 py-3"><BooleanBadge value={item.tem_prioridade_legal} /></td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
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
                  <td colSpan={10} className="px-4 py-8 text-center text-gov-muted">
                    Nenhum requerimento cadastrado para este posto.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
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
