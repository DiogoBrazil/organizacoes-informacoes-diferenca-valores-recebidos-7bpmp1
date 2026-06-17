import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { api, TOKEN_KEY } from "../services/api";
import type { Usuario } from "../types";

interface AuthContextValue {
  token: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  async function login(email: string, senha: string) {
    const { data } = await api.post<{ access_token: string }>("/auth/login", { email, senha });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    const usuarioResponse = await api.get<Usuario>("/auth/me");
    setUsuario(usuarioResponse.data);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  }

  useEffect(() => {
    let active = true;
    async function carregarUsuario() {
      if (!token) {
        setUsuario(null);
        return;
      }
      try {
        const { data } = await api.get<Usuario>("/auth/me");
        if (active) {
          setUsuario(data);
        }
      } catch {
        if (active) {
          setUsuario(null);
        }
      }
    }
    carregarUsuario();
    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({ token, usuario, isAuthenticated: Boolean(token), login, logout }),
    [token, usuario]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
