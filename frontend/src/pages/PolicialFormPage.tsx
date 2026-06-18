import { Shield } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FormActions from "../components/FormActions";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useLoader } from "../context/LoaderContext";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { maskMatricula } from "../services/masks";
import { POSTOS_GRADUACOES, type Policial, type PostoGraduacao } from "../types";

export default function PolicialFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { withLoader } = useLoader();
  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    posto_graduacao: "SD PM" as PostoGraduacao,
    matricula: "",
    nome_completo: "",
  });

  useEffect(() => {
    if (!id) return;
    async function carregar() {
      try {
        const { data } = await api.get<Policial>(`/policiais/${id}`);
        setForm({
          posto_graduacao: data.posto_graduacao,
          matricula: String(data.matricula),
          nome_completo: data.nome_completo,
        });
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      } finally {
        setLoading(false);
      }
    }
    void carregar();
  }, [id, showToast]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.matricula.length !== 9 || !form.matricula.startsWith("1000")) {
      showToast("A matrícula deve ter 9 dígitos e iniciar com 1000.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      posto_graduacao: form.posto_graduacao,
      matricula: Number(form.matricula),
      nome_completo: form.nome_completo,
    };
    try {
      await withLoader(async () => {
        if (editando) {
          await api.put(`/policiais/${id}`, payload);
        } else {
          await api.post("/policiais", payload);
        }
      }, editando ? "Atualizando..." : "Salvando...");
      showToast(editando ? "Policial atualizado com sucesso." : "Policial criado com sucesso.");
      navigate("/policiais");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader
        title={editando ? "Editar Policial Militar" : "Adicionar Policial Militar"}
        eyebrow={editando ? "Efetivo · edição" : "Efetivo · novo cadastro"}
        subtitle="Informe posto, matrícula e nome completo do requerente."
        icon={Shield}
      />
      <form onSubmit={handleSubmit} className="surface-card p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold">Posto/Graduação</span>
            <select
              value={form.posto_graduacao}
              onChange={(event) =>
                setForm({ ...form, posto_graduacao: event.target.value as PostoGraduacao })
              }
              className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            >
              {POSTOS_GRADUACOES.map((posto) => (
                <option key={posto} value={posto}>
                  {posto}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Matrícula</span>
            <input
              inputMode="numeric"
              maxLength={9}
              value={form.matricula}
              onChange={(event) =>
                setForm({ ...form, matricula: maskMatricula(event.target.value) })
              }
              required
              placeholder="100000000"
              className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block md:col-span-1">
            <span className="text-sm font-semibold">Nome Completo</span>
            <input
              value={form.nome_completo}
              onChange={(event) => setForm({ ...form, nome_completo: event.target.value })}
              required
              minLength={3}
              className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <FormActions saving={saving} />
      </form>
    </>
  );
}
