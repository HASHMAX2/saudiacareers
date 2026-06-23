export function Spinner({ label = "Loading" }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-sm font-medium" style={{ color: "var(--text-secondary)" }} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
      <span>{label}</span>
    </span>
  );
}
