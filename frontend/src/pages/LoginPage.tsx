import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@pmro.local");
  const [senha, setSenha] = useState("admin123");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const expired = new URLSearchParams(location.search).get("expired");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await login(email, senha);
      navigate("/", { replace: true });
    } catch (error) {
      setErro(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gov-bg p-4">
      <section className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-gov-primary font-bold text-white">
            PM
          </div>
          <div>
            <p className="text-sm font-semibold text-gov-muted">PMRO</p>
            <h1 className="text-xl font-bold">Gestão de Requerimentos</h1>
          </div>
        </div>
        {expired ? (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
            Sua sessão expirou. Entre novamente para continuar.
          </div>
        ) : null}
        {erro ? (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {erro}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Senha</span>
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
              className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full rounded bg-gov-primary px-4 py-2 font-semibold text-white hover:bg-gov-secondary disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
