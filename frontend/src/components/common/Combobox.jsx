import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_MAX_HEIGHT = 240; // px, matches max-h-60
const MENU_GAP = 6;

// Searchable, keyboard-accessible dropdown — same visual language and portal
// positioning as Select.jsx, but with a type-to-filter input for long option
// lists (e.g. the ~195-country list) where a plain listbox isn't usable.
export function Combobox({
  id, label, labelHint, required, error, value, onChange, options,
  placeholder = "Select…", searchPlaceholder = "Type to search…", className = "", disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuRect, setMenuRect] = useState(null);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && rect.top > spaceBelow;
    setMenuRect({
      left: rect.left,
      width: rect.width,
      top: openUpward ? undefined : rect.bottom + MENU_GAP,
      bottom: openUpward ? window.innerHeight - rect.top + MENU_GAP : undefined,
    });
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus the search input once the portal has mounted.
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function onScroll(e) {
      // Scrolling inside the dropdown's own option list must not close it —
      // only close on scrolling elsewhere (e.g. the page behind it).
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function pick(val) {
    onChange?.({ target: { value: val } });
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) pick(filtered[activeIndex]);
    }
  }

  const control = (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="field-box flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          border: "1px solid var(--border-default)",
          background: "var(--bg-white)",
          ...(error ? { borderColor: "#f87171" } : {}),
        }}
      >
        <span className="truncate" style={{ color: value ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-tertiary)" }}
        />
      </button>

      {open && menuRect && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] rounded-xl bg-white py-1.5"
          style={{
            left: menuRect.left,
            width: menuRect.width,
            top: menuRect.top,
            bottom: menuRect.bottom,
            border: "1px solid var(--border-default)",
            boxShadow: "var(--sh-2)",
          }}
        >
          <div className="px-2 pb-1.5">
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={id ? `${id}-listbox` : undefined}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none"
              style={{ border: "1px solid var(--border-default)" }}
            />
          </div>
          <div id={id ? `${id}-listbox` : undefined} role="listbox" className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-4 py-2 text-sm" style={{ color: "var(--text-tertiary)" }}>No matches</p>
            )}
            {filtered.map((opt, i) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={value === opt}
                onClick={() => pick(opt)}
                onMouseEnter={() => setActiveIndex(i)}
                className="block w-full px-4 py-2 text-left text-sm transition-colors"
                style={{
                  color: value === opt ? "var(--accent)" : "var(--text-primary)",
                  fontWeight: value === opt ? 600 : 400,
                  background: i === activeIndex ? "var(--bg-elev)" : "transparent",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );

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
