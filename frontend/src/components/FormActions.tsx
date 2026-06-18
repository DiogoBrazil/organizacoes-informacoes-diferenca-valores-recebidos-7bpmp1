import { Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FormActions({ saving }: { saving: boolean }) {
  const navigate = useNavigate();

  return (
    <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
      <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">
        <X className="h-4 w-4" />
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="btn btn-primary">
        <Save className="h-4 w-4" />
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
