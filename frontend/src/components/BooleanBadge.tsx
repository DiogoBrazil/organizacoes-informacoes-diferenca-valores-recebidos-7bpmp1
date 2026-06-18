export default function BooleanBadge({
  value,
  falseVariant = "neutral",
}: {
  value: boolean;
  falseVariant?: "neutral" | "danger";
}) {
  const falseClasses =
    falseVariant === "danger" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex min-w-12 justify-center rounded px-2 py-1 text-xs font-bold ${
        value ? "bg-green-100 text-green-800" : falseClasses
      }`}
    >
      {value ? "SIM" : "NÃO"}
    </span>
  );
}
