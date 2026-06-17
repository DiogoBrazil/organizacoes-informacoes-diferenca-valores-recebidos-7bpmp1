import { FileText, Home, LogOut, Shield, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/policiais", label: "Policiais", icon: Shield },
  { to: "/requerimentos", label: "Requerimentos", icon: FileText },
];

export default function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gov-bg">
      <header className="border-b border-slate-200 bg-white">
        <div className="page-shell flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-gov-primary text-sm font-bold text-white">
              PM
            </div>
            <div>
              <p className="text-sm font-semibold text-gov-muted">PMRO</p>
              <h1 className="text-lg font-bold text-gov-text">Gestão de Requerimentos</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="focus-ring inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-gov-text hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
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
      </header>
      <main className="page-shell py-6">
        <Outlet />
      </main>
    </div>
  );
}
