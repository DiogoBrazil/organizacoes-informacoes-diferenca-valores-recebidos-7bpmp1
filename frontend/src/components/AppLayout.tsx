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

export default function AppLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gov-bg">
      <header className="border-b border-slate-200 bg-white">
        <div
          className={
            isHome
              ? "page-shell flex flex-col items-center gap-4 py-6 sm:relative"
              : "page-shell flex min-h-16 flex-wrap items-center justify-between gap-3 py-3"
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
                  ? "h-28 w-28 shrink-0 object-contain sm:h-32 sm:w-32"
                  : "h-12 w-12 shrink-0 object-contain"
              }
            />
            <h1
              className={
                isHome
                  ? "text-xl font-bold leading-snug text-gov-text sm:text-2xl"
                  : "min-w-0 text-base font-bold text-gov-text sm:text-lg"
              }
            >
              Gestão de requerimentos sobre recálculo de valores recebidos
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={
              isHome
                ? "focus-ring inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-gov-text hover:bg-slate-50 sm:absolute sm:right-0 sm:top-6"
                : "focus-ring inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-gov-text hover:bg-slate-50"
            }
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
        {!isHome ? (
          <nav className="page-shell flex gap-1 overflow-x-auto pb-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `focus-ring inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold ${
                      isActive
                        ? "bg-gov-primary text-white"
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
      <main className="page-shell py-6">
        <Outlet />
      </main>
    </div>
  );
}
