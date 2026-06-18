import { Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FormActions from "../components/FormActions";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import type { Usuario } from "../types";

export default function UsuarioFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { usuario: usuarioLogado } = useAuth();
  const ehProprioUsuario = editando && usuarioLogado?.id === id;
  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    senha_atual: "",
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
    if (ehProprioUsuario && form.senha && form.senha !== form.confirmarSenha) {
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
        if (ehProprioUsuario && form.senha) {
          await api.put(`/usuarios/${id}/senha`, {
            senha_atual: form.senha_atual,
            senha: form.senha,
          });
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

  const subtitle = !editando
    ? "Informe os dados de acesso do operador."
    : ehProprioUsuario
      ? "Atualize seus dados e, se desejar, altere sua senha."
      : "Atualize o nome e o e-mail do operador.";

  return (
    <>
      <PageHeader
        title={editando ? "Editar Usuário" : "Adicionar Usuário"}
        eyebrow={editando ? "Administração · edição" : "Administração · novo cadastro"}
        subtitle={subtitle}
        icon={Users}
      />
      <form onSubmit={handleSubmit} className="surface-card p-5 sm:p-6">
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
          {!editando ? (
            <>
              <label className="block">
                <span className="text-sm font-semibold">Senha</span>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(event) => setForm({ ...form, senha: event.target.value })}
                  required
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
                  required
                  minLength={6}
                  className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
                />
              </label>
            </>
          ) : null}
        </div>

        {ehProprioUsuario ? (
          <fieldset className="mt-6 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-bold text-gov-text">Alterar senha (opcional)</legend>
            <p className="mb-3 text-sm text-gov-muted">
              Preencha os campos abaixo apenas se quiser alterar a sua senha.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-semibold">Senha Atual</span>
                <input
                  type="password"
                  value={form.senha_atual}
                  onChange={(event) => setForm({ ...form, senha_atual: event.target.value })}
                  required={Boolean(form.senha)}
                  autoComplete="current-password"
                  className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Nova Senha</span>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(event) => setForm({ ...form, senha: event.target.value })}
                  minLength={6}
                  autoComplete="new-password"
                  className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Confirmar Nova Senha</span>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(event) => setForm({ ...form, confirmarSenha: event.target.value })}
                  required={Boolean(form.senha)}
                  minLength={form.senha ? 6 : undefined}
                  autoComplete="new-password"
                  className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
          </fieldset>
        ) : null}

        <FormActions saving={saving} />
      </form>
    </>
  );
}
