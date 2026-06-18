import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { LoaderProvider } from "./context/LoaderContext";
import { ToastProvider } from "./context/ToastContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PolicialFormPage from "./pages/PolicialFormPage";
import PoliciaisPage from "./pages/PoliciaisPage";
import RequerimentoFormPage from "./pages/RequerimentoFormPage";
import RequerimentoViewPage from "./pages/RequerimentoViewPage";
import RequerimentosPage from "./pages/RequerimentosPage";
import RequerimentosPorPostoPage from "./pages/RequerimentosPorPostoPage";
import UsuarioFormPage from "./pages/UsuarioFormPage";
import UsuariosPage from "./pages/UsuariosPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <LoaderProvider>
          <AuthProvider>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="usuarios" element={<UsuariosPage />} />
              <Route path="usuarios/novo" element={<UsuarioFormPage />} />
              <Route path="usuarios/:id/editar" element={<UsuarioFormPage />} />
              <Route path="policiais" element={<PoliciaisPage />} />
              <Route path="policiais/novo" element={<PolicialFormPage />} />
              <Route path="policiais/:id/editar" element={<PolicialFormPage />} />
              <Route path="requerimentos" element={<RequerimentosPage />} />
              <Route path="requerimentos/novo" element={<RequerimentoFormPage />} />
              <Route path="requerimentos/:id/visualizar" element={<RequerimentoViewPage />} />
              <Route path="requerimentos/:id/editar" element={<RequerimentoFormPage />} />
              <Route path="requerimentos/:posto" element={<RequerimentosPorPostoPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </LoaderProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
