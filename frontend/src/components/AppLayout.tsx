import { FileText, Home, LogOut, Shield, Users } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import logo7Bpm from "../assets/images/logo-7bpm.png";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/policiais", label: "Policiais", icon: Shield },
  { to: "/requerimentos", label: "Requerimentos", icon: FileText },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "PM";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export default function AppLayout() {
  const { logout, usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gov-bg">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-header backdrop-blur">
        <div aria-hidden className="h-1 w-full bg-gradient-to-r from-gov-ink via-gov-secondary to-gov-primary" />
        <div
          className={
            isHome
              ? "page-shell flex flex-col items-center gap-4 py-7 sm:relative"
              : "page-shell flex min-h-16 flex-wrap items-center justify-between gap-3 py-3.5"
          }
        >
          <div
            className={
              isHome
                ? "flex max-w-3xl flex-col items-center gap-3 text-center"
                : "flex min-w-0 items-center gap-3"
            }
          >
            <img
              src={logo7Bpm}
              alt="Logo oficial do 7º BPMP1"
              className={
                isHome
                  ? "h-28 w-28 shrink-0 object-contain drop-shadow-sm sm:h-32 sm:w-32"
                  : "h-12 w-12 shrink-0 object-contain"
              }
            />
            <div className={isHome ? "" : "min-w-0"}>
              {!isHome ? (
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-gov-primary/80">
                  7º BPMP1 · PMRO
                </p>
              ) : null}
              <h1
                className={
                  isHome
                    ? "font-display text-xl font-bold leading-snug tracking-tight text-gov-text sm:text-2xl"
                    : "min-w-0 truncate font-display text-base font-bold leading-tight tracking-tight text-gov-text sm:text-lg"
                }
              >
                Gestão de requerimentos sobre recálculo de valores recebidos
              </h1>
            </div>
          </div>
          <div
            className={
              isHome
                ? "flex flex-wrap items-center justify-center gap-3 sm:absolute sm:right-0 sm:top-7"
                : "flex flex-wrap items-center justify-end gap-2.5"
            }
          >
            {usuario ? (
              <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/80 py-1 pl-1 pr-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gov-primary text-xs font-bold text-white">
                  {initials(usuario.nome_completo)}
                </span>
                <span className="hidden text-sm font-semibold text-gov-text sm:inline">
                  {usuario.nome_completo}
                </span>
              </div>
            ) : null}
            <button type="button" onClick={handleLogout} className="btn btn-outline">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
        {!isHome ? (
          <nav className="page-shell flex gap-1.5 overflow-x-auto pb-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `focus-ring inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-gov-primary/10 text-gov-primary ring-1 ring-inset ring-gov-primary/20"
                        : "text-gov-muted hover:bg-slate-100 hover:text-gov-text"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        ) : null}
      </header>
      <main className="page-shell py-7">
        <Outlet />
      </main>
    </div>
  );
}
