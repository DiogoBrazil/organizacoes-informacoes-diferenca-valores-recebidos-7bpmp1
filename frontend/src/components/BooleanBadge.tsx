export default function BooleanBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex min-w-12 justify-center rounded px-2 py-1 text-xs font-bold ${
        value ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"
      }`}
    >
      {value ? "SIM" : "NÃO"}
    </span>
  );
}
