import { Save, Shield, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { maskMatricula } from "../services/masks";
import { POSTOS_GRADUACOES, type Policial, type PostoGraduacao } from "../types";

interface PolicialFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (policial: Policial) => void;
}

const formInicial = {
  posto_graduacao: "SD PM" as PostoGraduacao,
  matricula: "",
  nome_completo: "",
  opm: "7º BPM",
};

export default function PolicialFormModal({ open, onClose, onCreated }: PolicialFormModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState(formInicial);
  const [saving, setSaving] = useState(false);

  // Reinicia o formulário sempre que o modal é (re)aberto.
  useEffect(() => {
    if (open) setForm(formInicial);
  }, [open]);

  // Fecha com a tecla Esc.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.matricula.length !== 9 || !form.matricula.startsWith("1000")) {
      showToast("A matrícula deve ter 9 dígitos e iniciar com 1000.", "error");
      return;
    }
    if (form.opm.trim().length < 2) {
      showToast("Informe a OPM do policial.", "error");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post<Policial>("/policiais", {
        posto_graduacao: form.posto_graduacao,
        matricula: Number(form.matricula),
        nome_completo: form.nome_completo,
        opm: form.opm.trim(),
      });
      showToast("Policial militar cadastrado com sucesso.");
      onCreated(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Adicionar Policial Militar"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gov-primary" />
            <h2 className="text-lg font-bold text-gov-text">Adicionar Policial Militar</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded p-1.5 text-gov-muted hover:bg-slate-100"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
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
                autoFocus
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
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Nome Completo</span>
              <input
                value={form.nome_completo}
                onChange={(event) => setForm({ ...form, nome_completo: event.target.value })}
                required
                minLength={3}
                className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">OPM</span>
              <input
                value={form.opm}
                onChange={(event) => setForm({ ...form, opm: event.target.value })}
                required
                minLength={2}
                maxLength={60}
                placeholder="7º BPM"
                className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="btn btn-outline">
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
