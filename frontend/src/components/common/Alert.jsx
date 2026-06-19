export function Alert({ children, tone = "error" }) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${styles}`} role="alert">{children}</div>;
}
