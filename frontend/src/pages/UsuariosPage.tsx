import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { parseTotalCount } from "../services/masks";
import type { Usuario } from "../types";

const PER_PAGE = 10;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState<Usuario | null>(null);
  const { showToast } = useToast();

  async function carregar() {
    setLoading(true);
    try {
      const response = await api.get<Usuario[]>("/usuarios", {
        params: { busca: busca || undefined, page, per_page: PER_PAGE },
      });
      setUsuarios(response.data);
      setTotal(parseTotalCount(response.headers["x-total-count"]));
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [busca, page]);

  async function confirmarExclusao() {
    if (!removendo) return;
    try {
      await api.delete(`/usuarios/${removendo.id}`);
      showToast("Usuário excluído com sucesso.");
      setRemovendo(null);
      await carregar();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        subtitle="Gerencie os operadores autenticados do sistema."
        actions={
          <Link
            to="/usuarios/novo"
            className="focus-ring inline-flex items-center gap-2 rounded bg-gov-primary px-4 py-2 text-sm font-semibold text-white hover:bg-gov-secondary"
          >
            <Plus className="h-4 w-4" />
            Adicionar Usuário
          </Link>
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
          placeholder="Buscar por nome ou e-mail"
          className="focus-ring w-full border-0 bg-transparent outline-none"
        />
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-center text-sm">
            <thead className="bg-slate-100 text-gov-muted">
              <tr>
                <th className="border border-slate-300 px-4 py-3">Nome Completo</th>
                <th className="border border-slate-300 px-4 py-3">E-mail</th>
                <th className="border border-slate-300 px-4 py-3">Data de Cadastro</th>
                <th className="border border-slate-300 px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario, index) => (
                <tr key={usuario.id} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="border border-slate-300 px-4 py-3 font-medium">{usuario.nome_completo}</td>
                  <td className="border border-slate-300 px-4 py-3">{usuario.email}</td>
                  <td className="border border-slate-300 px-4 py-3">
                    {new Intl.DateTimeFormat("pt-BR").format(new Date(usuario.criado_em))}
                  </td>
                  <td className="border border-slate-300 px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Link
                        to={`/usuarios/${usuario.id}/editar`}
                        className="focus-ring rounded p-2 text-gov-primary hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setRemovendo(usuario)}
                        className="focus-ring rounded p-2 text-gov-danger hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!usuarios.length ? (
                <tr>
                  <td colSpan={4} className="border border-slate-300 px-4 py-8 text-center text-gov-muted">
                    Nenhum usuário encontrado.
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
        title="Excluir usuário"
        message={`Deseja excluir ${removendo?.nome_completo ?? "este usuário"}?`}
        onCancel={() => setRemovendo(null)}
        onConfirm={confirmarExclusao}
      />
    </>
  );
}
