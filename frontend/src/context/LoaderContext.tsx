import { createContext, ReactNode, useCallback, useContext, useState } from "react";

import logo7Bpm from "../assets/images/logo-7bpm.png";

const MIN_LOADER_MS = 2000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface LoaderContextValue {
  /**
   * Executa `task` exibindo o loader global por, no mínimo, MIN_LOADER_MS,
   * ou até a task terminar (o que for mais longo). Em erro, esconde de imediato.
   */
  withLoader: <T>(task: () => Promise<T>, message?: string) => Promise<T>;
}

const LoaderContext = createContext<LoaderContextValue | undefined>(undefined);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("Processando...");

  const withLoader = useCallback(
    async <T,>(task: () => Promise<T>, msg = "Processando..."): Promise<T> => {
      setMessage(msg);
      setActive((count) => count + 1);
      try {
        const [result] = await Promise.all([task(), delay(MIN_LOADER_MS)]);
        return result;
      } finally {
        setActive((count) => count - 1);
      }
    },
    []
  );

  return (
    <LoaderContext.Provider value={{ withLoader }}>
      {children}
      {active > 0 ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 backdrop-blur-sm"
        >
          <div className="surface-card flex flex-col items-center gap-4 px-8 py-7">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-gov-primary motion-reduce:animate-none"
              />
              <img
                src={logo7Bpm}
                alt=""
                aria-hidden
                className="h-10 w-10 object-contain"
              />
            </div>
            <p className="text-sm font-semibold text-gov-text">{message}</p>
            <span className="sr-only">Carregando, por favor aguarde.</span>
          </div>
        </div>
      ) : null}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader deve ser usado dentro de LoaderProvider");
  }
  return context;
}
