import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FormActions from "../components/FormActions";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { POSTOS_GRADUACOES, type Policial, type PostoGraduacao } from "../types";

export default function PolicialFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
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
    setSaving(true);
    const payload = {
      posto_graduacao: form.posto_graduacao,
      matricula: Number(form.matricula),
      nome_completo: form.nome_completo,
    };
    try {
      if (editando) {
        await api.put(`/policiais/${id}`, payload);
      } else {
        await api.post("/policiais", payload);
      }
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
        subtitle="Informe posto, matrícula e nome completo do requerente."
      />
      <form onSubmit={handleSubmit} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
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
              type="number"
              min={1}
              value={form.matricula}
              onChange={(event) => setForm({ ...form, matricula: event.target.value })}
              required
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
