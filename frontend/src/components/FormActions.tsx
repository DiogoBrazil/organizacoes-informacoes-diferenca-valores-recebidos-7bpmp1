import { Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FormActions({ saving }: { saving: boolean }) {
  const navigate = useNavigate();

  return (
    <div className="mt-6 flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="focus-ring inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
      >
        <X className="h-4 w-4" />
        Cancelar
      </button>
      <button
        type="submit"
        disabled={saving}
        className="focus-ring inline-flex items-center gap-2 rounded bg-gov-primary px-4 py-2 text-sm font-semibold text-white hover:bg-gov-secondary disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Save className="h-4 w-4" />
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
