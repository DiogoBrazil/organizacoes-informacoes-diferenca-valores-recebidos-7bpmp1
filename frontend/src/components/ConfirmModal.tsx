import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Excluir",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 text-gov-danger" />
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm text-gov-muted">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring rounded border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="focus-ring rounded bg-gov-danger px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
