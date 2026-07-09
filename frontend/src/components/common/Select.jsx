import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function Select({
  id, label, labelHint, required, error, value, onChange, options,
  placeholder = "Select…", className = "", icon: Icon, pill = false, bare = false, disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    function onEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const normalized = options.map((o) => (typeof o === "string" || typeof o === "number" ? { value: o, label: String(o) } : o));
  const selected = normalized.find((o) => o.value === value);

  function pick(val) {
    onChange?.({ target: { value: val } });
    setOpen(false);
  }

  const control = (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${pill ? "rounded-full px-4 py-2.5 text-sm" : "field-box"}`}
        style={{
          border: "1px solid var(--border-default)",
          background: "var(--bg-white)",
          ...(error ? { borderColor: "#f87171" } : {}),
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && <Icon size={15} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />}
          <span className="truncate" style={{ color: selected ? "var(--text-primary)" : "var(--text-tertiary)" }}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-tertiary)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-white py-1.5"
          style={{ border: "1px solid var(--border-default)", boxShadow: "var(--sh-2)" }}
          role="listbox"
        >
          {normalized.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => pick(opt.value)}
              className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-elev)]"
              style={{
                color: value === opt.value ? "var(--accent)" : "var(--text-primary)",
                fontWeight: value === opt.value ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (bare) return control;

  return (
    <label className="block" htmlFor={id}>
      {label && (
        <span className="field-label flex items-baseline gap-2">
          <span>
            {label}
            {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
          </span>
          {labelHint && (
            <span className="text-[11px] font-normal normal-case" style={{ color: "var(--text-tertiary)" }}>
              ({labelHint})
            </span>
          )}
        </span>
      )}
      {control}
      {error && <span className="mt-1.5 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
