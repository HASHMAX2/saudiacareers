import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { COUNTRY_CODES, parsePhone } from "../../utils/countryCodes.js";

const PRIORITY = COUNTRY_CODES.filter((c) =>  c.priority);
const REST     = COUNTRY_CODES.filter((c) => !c.priority);
const ALL      = [...PRIORITY, ...REST];

export function PhoneInput({ label, required, error, id, value = "", onChange, disabled }) {
  const { code, digits } = parsePhone(value);

  const [open,       setOpen]       = useState(false);
  const [query,      setQuery]      = useState("");
  const [anyFocused, setAnyFocused] = useState(false);

  const wrapperRef = useRef(null);
  const searchRef  = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (!wrapperRef.current?.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Auto-focus the search box when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  const emit = (newCode, newDigits) =>
    onChange?.({ target: { value: newDigits === "" ? "" : newCode + newDigits } });

  // Match dial code prefix (with or without leading +) OR country name substring
  const q = query.trim().toLowerCase();
  const codeQuery = q.startsWith("+") ? q : q ? "+" + q : "";
  const filtered = !q
    ? ALL
    : ALL.filter(
        (c) =>
          c.dialCode.startsWith(codeQuery) ||
          c.name.toLowerCase().includes(q),
      );
  const filteredPriority = filtered.filter((c) =>  c.priority);
  const filteredRest     = filtered.filter((c) => !c.priority);

  function toggle() {
    if (disabled) return;
    if (open) { setOpen(false); setQuery(""); }
    else      { setOpen(true); }
  }

  function pick(dialCode) {
    setOpen(false);
    setQuery("");
    emit(dialCode, digits);
    setTimeout(() => document.getElementById(id ? id + "-digits" : "")?.focus(), 0);
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Escape") { setOpen(false); setQuery(""); triggerRef.current?.focus(); }
    if (e.key === "Enter" && filtered.length > 0) { e.preventDefault(); pick(filtered[0].dialCode); }
  }

  const borderColor = error ? "#f87171" : anyFocused ? "var(--accent)" : "var(--border-default)";
  const shadow      = anyFocused ? "0 0 0 3px var(--accent-subtle)" : "none";

  return (
    <label className="block" htmlFor={id ? id + "-digits" : undefined}>
      {label && (
        <span className="field-label">
          {label}
          {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
        </span>
      )}

      <div
        ref={wrapperRef}
        className="relative flex items-stretch rounded-xl bg-white transition-colors"
        style={{ border: `1px solid ${borderColor}`, boxShadow: shadow }}
      >

        {/* ── Trigger button ─────────────────────────────────────────── */}
        <div className="relative flex-shrink-0" style={{ borderRight: "1px solid var(--border-default)" }}>
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            onClick={toggle}
            onFocus={() => setAnyFocused(true)}
            onBlur={() => setAnyFocused(false)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex items-center gap-1.5 h-full px-3"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              minWidth: "80px",
            }}
          >
            <span className="font-mono text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {code}
            </span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
              style={{ color: "var(--text-tertiary)" }}
            />
          </button>

          {/* ── Dropdown ─────────────────────────────────────────────── */}
          {open && (
            <div
              className="absolute left-0 z-50 rounded-xl bg-white"
              style={{
                top: "calc(100% + 4px)",
                minWidth: "220px",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--sh-2)",
              }}
            >
              {/* Search */}
              <div className="p-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search code or country…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full rounded-lg py-1.5 pl-7 pr-3 text-xs outline-none"
                    style={{
                      border: "1px solid var(--border-default)",
                      background: "var(--bg-elev)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              {/* Results list */}
              <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
                {filtered.length === 0 && (
                  <p className="px-3 py-4 text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                    No matching code
                  </p>
                )}

                {filteredPriority.length > 0 && (
                  <>
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                      Common
                    </p>
                    {filteredPriority.map((c) => (
                      <DropdownRow key={c.dialCode} code={c.dialCode} name={c.name} active={c.dialCode === code} onPick={pick} />
                    ))}
                  </>
                )}

                {filteredRest.length > 0 && (
                  <>
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                      All countries
                    </p>
                    {filteredRest.map((c) => (
                      <DropdownRow key={c.dialCode} code={c.dialCode} name={c.name} active={c.dialCode === code} onPick={pick} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Digits input ───────────────────────────────────────────── */}
        <input
          id={id ? id + "-digits" : undefined}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Phone number"
          value={digits}
          onChange={(e) => emit(code, e.target.value.replace(/\D/g, ""))}
          onFocus={() => setAnyFocused(true)}
          onBlur={() => setAnyFocused(false)}
          disabled={disabled}
          required={required}
          className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      {/* Submit-time error from parent */}
      {error && <span className="mt-1.5 block text-xs text-red-600">{error}</span>}

      {/* Real-time hint: shown only while typing, before form is submitted */}
      {!error && digits.length > 0 && digits.length < 6 && (
        <span className="mt-1.5 block text-xs" style={{ color: "var(--gold-ink)" }}>
          Enter at least 6 digits for your local number
        </span>
      )}
    </label>
  );
}

function DropdownRow({ code, name, active, onPick }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onPick(code); }}
      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--bg-elev)]"
    >
      <span
        className="font-mono text-sm font-medium shrink-0"
        style={{ width: "48px", color: active ? "var(--accent)" : "var(--text-primary)" }}
      >
        {code}
      </span>
      <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
        {name}
      </span>
    </button>
  );
}
