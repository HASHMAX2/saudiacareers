const tones = {
  neutral: "border-[var(--border-default)] bg-[var(--bg-elev)] text-[var(--text-secondary)]",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  green: "border-emerald-200 bg-[var(--accent-subtle)] text-[var(--accent)]",
  red: "border-red-200 bg-red-50 text-red-700",
};

export function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium leading-none ${tones[tone]}`}>
      {children}
    </span>
  );
}
