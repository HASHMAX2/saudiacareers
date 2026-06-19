export function Spinner({ label = "Loading" }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-600" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      <span>{label}</span>
    </span>
  );
}
