export default function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded border border-slate-200 bg-white p-8 text-sm text-gov-muted">
      <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-gov-secondary border-t-transparent" />
      {label}
    </div>
  );
}
