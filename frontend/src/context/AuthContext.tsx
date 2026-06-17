import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { api, TOKEN_KEY } from "../services/api";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  async function login(email: string, senha: string) {
    const { data } = await api.post<{ access_token: string }>("/auth/login", { email, senha });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  const value = useMemo(
    () => ({ token, isAuthenticated: Boolean(token), login, logout }),
    [token]
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
