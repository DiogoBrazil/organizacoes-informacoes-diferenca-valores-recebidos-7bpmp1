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
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-header">
        <div aria-hidden className="h-[3px] w-full bg-gov-primary" />
        <div
          className={
            isHome
              ? "page-shell flex flex-col items-center gap-3 py-7 sm:relative"
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
              alt="Logo oficial do 7º BPM P1"
              className={
                isHome
                  ? "h-28 w-28 shrink-0 object-contain sm:h-32 sm:w-32"
                  : "h-12 w-12 shrink-0 object-contain"
              }
            />
            {!isHome ? (
              <span aria-hidden className="hidden h-10 w-px bg-slate-200 sm:block" />
            ) : null}
            <div className={isHome ? "" : "min-w-0"}>
              <p
                className={
                  isHome
                    ? "text-[0.72rem] font-bold uppercase tracking-[0.18em] text-gov-primary"
                    : "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-gov-primary"
                }
              >
                7º BPM P1 • PMRO
              </p>
              <h1
                className={
                  isHome
                    ? "font-display text-xl font-bold leading-snug tracking-tight text-gov-text sm:text-2xl"
                    : "min-w-0 truncate font-display text-base font-bold leading-tight tracking-tight text-gov-text sm:text-lg"
                }
              >
                Gestão de requerimentos sobre recálculo de valores recebidos
              </h1>
              {isHome ? (
                <p className="mt-1 text-sm text-gov-muted">Polícia Militar do Estado de Rondônia</p>
              ) : null}
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
              <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gov-primary text-xs font-bold text-white">
                  {initials(usuario.nome_completo)}
                </span>
                <span className="hidden max-w-[14rem] truncate text-sm font-semibold text-gov-text sm:inline">
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
          <nav
            aria-label="Navegação principal"
            className="page-shell -mb-px flex gap-1 overflow-x-auto"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `focus-ring inline-flex shrink-0 items-center gap-2 border-b-2 px-2.5 pb-3 pt-1.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "border-gov-primary text-gov-primary"
                        : "border-transparent text-gov-muted hover:border-slate-300 hover:text-gov-text"
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
