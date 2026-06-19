export function Toast({ message, tone = "success", onDismiss }) {
  if (!message) return null;
  const toneClass =
    tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div className={`fixed inset-x-4 top-4 z-50 rounded-xl border px-4 py-3 shadow-lg sm:left-auto sm:right-4 sm:w-auto ${toneClass}`} role="status">
      <div className="flex items-center gap-4">
        <span>{message}</span>
        {onDismiss ? (
          <button className="font-semibold" onClick={onDismiss} type="button">
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
