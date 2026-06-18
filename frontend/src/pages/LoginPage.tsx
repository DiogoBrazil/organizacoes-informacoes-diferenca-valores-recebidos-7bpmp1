import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import logo7Bpm from "../assets/images/logo-7bpm.png";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gov-ink p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(900px 500px at 12% -10%, rgba(38,112,232,0.45), transparent 60%), radial-gradient(800px 520px at 100% 110%, rgba(19,81,180,0.5), transparent 55%)",
        }}
      />
      <section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="p-7 sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <img
              src={logo7Bpm}
              alt="Logo oficial do 7º BPMP1"
              className="h-24 w-24 shrink-0 object-contain drop-shadow-sm"
            />
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-gov-primary/80">
                Polícia Militar de Rondônia
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-gov-text">7º BPMP1</h1>
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
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
            {loading ? "Entrando..." : "Entrar"}
          </button>
          </form>
        </div>
      </section>
    </main>
  );
}
