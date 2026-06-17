import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FormActions from "../components/FormActions";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import type { Usuario } from "../types";

export default function UsuarioFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  useEffect(() => {
    if (!id) return;
    async function carregar() {
      try {
        const { data } = await api.get<Usuario>(`/usuarios/${id}`);
        setForm((current) => ({
          ...current,
          nome_completo: data.nome_completo,
          email: data.email,
        }));
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
    if (!editando && form.senha !== form.confirmarSenha) {
      showToast("As senhas informadas não conferem.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editando) {
        await api.put(`/usuarios/${id}`, {
          nome_completo: form.nome_completo,
          email: form.email,
        });
        if (form.senha) {
          if (form.senha !== form.confirmarSenha) {
            showToast("As senhas informadas não conferem.", "error");
            return;
          }
          await api.put(`/usuarios/${id}/senha`, { senha: form.senha });
        }
      } else {
        await api.post("/usuarios", {
          nome_completo: form.nome_completo,
          email: form.email,
          senha: form.senha,
        });
      }
      showToast(editando ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso.");
      navigate("/usuarios");
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
        title={editando ? "Editar Usuário" : "Adicionar Usuário"}
        subtitle="Informe os dados de acesso do operador."
      />
      <form onSubmit={handleSubmit} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Nome Completo</span>
            <input
              value={form.nome_completo}
              onChange={(event) => setForm({ ...form, nome_completo: event.target.value })}
              required
              minLength={3}
              className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">E-mail</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">
              {editando ? "Nova Senha" : "Senha"}
            </span>
            <input
              type="password"
              value={form.senha}
              onChange={(event) => setForm({ ...form, senha: event.target.value })}
              required={!editando}
              minLength={6}
              className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Confirmar Senha</span>
            <input
              type="password"
              value={form.confirmarSenha}
              onChange={(event) => setForm({ ...form, confirmarSenha: event.target.value })}
              required={!editando || Boolean(form.senha)}
              minLength={form.senha ? 6 : undefined}
              className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <FormActions saving={saving} />
      </form>
    </>
  );
}
