import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

const LOCATIONS       = ["Riyadh", "Jeddah", "Dammam", "Other"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const EXPERIENCE_LEVELS = ["Fresh graduate", "1-2 years", "2-3 years", "3-5 years", "5-10 years", "10+ years"];
const GENDERS         = ["Any", "Male", "Female"];
const FRESHNESS_OPTIONS = [
  { value: 1,  label: "Last 24 hours" },
  { value: 3,  label: "Last 3 days" },
  { value: 7,  label: "Last week" },
  { value: 30, label: "Last 30 days" },
  { value: 60, label: "Last 60 days" },
];

export const EMPTY_FILTERS = {
  locations:       [],
  industries:      [],
  employmentTypes: [],
  experiences:     [],
  genders:         [],
  nationalities:   [],
  freshness:       [],
  sort:            "newest",
};

function countActive(filters) {
  return (
    filters.locations.length +
    filters.industries.length +
    filters.employmentTypes.length +
    filters.experiences.length +
    filters.genders.length +
    filters.nationalities.length +
    filters.freshness.length
  );
}

function FilterCard({ title, selectedCount, onClearSection, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card-soft overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
          {selectedCount > 0 && (
            <span
              className="grid h-4 min-w-4 place-items-center rounded px-1 text-[10px] font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              {selectedCount}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span
              role="button"
              tabIndex={0}
              className="text-[11px] font-medium hover:underline"
              style={{ color: "var(--accent)" }}
              onClick={(e) => { e.stopPropagation(); onClearSection(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClearSection(); } }}
            >
              Clear
            </span>
          )}
          <ChevronDown
            size={13}
            style={{
              color: "var(--text-tertiary)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          />
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3" style={{ borderTop: "1px solid var(--border-default)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function CheckboxList({ options, selected, onToggle }) {
  return (
    <div className="space-y-2 pt-3">
      {options.map((opt) => {
        const val     = typeof opt === "string" ? opt : opt.label;
        const checked = selected.includes(val);
        return (
          <label key={val} className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded"
              style={{ accentColor: "var(--accent)" }}
              checked={checked}
              onChange={() => onToggle(val)}
            />
            <span className="text-[13px] leading-tight" style={{ color: "var(--text-secondary)" }}>{val}</span>
          </label>
        );
      })}
    </div>
  );
}

export function FilterPanel({ filters, onApply, filterOptions, onClose, olderTab = false }) {
  const [staged, setStaged] = useState({ ...filters });

  useEffect(() => { setStaged({ ...filters }); }, [filters]);

  const totalActive  = countActive(staged);
  const appliedCount = countActive(filters);
  const isDirty      = JSON.stringify(staged) !== JSON.stringify(filters);

  function toggle(key, value) {
    setStaged((prev) => {
      const current = prev[key] || [];
      const next    = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function clearSection(key) {
    setStaged((prev) => ({ ...prev, [key]: [] }));
  }

  function apply() { onApply(staged); onClose?.(); }

  function reset() {
    const cleared = { ...EMPTY_FILTERS, sort: staged.sort };
    setStaged(cleared);
    onApply(cleared);
    onClose?.();
  }

  const industries    = filterOptions?.industries    ?? [];
  const nationalities = filterOptions?.nationalities ?? [];

  return (
    <div>
      {/*
        Sticky header — stays pinned to the top of the scrollable sidebar.
        The sidebar in Jobs.jsx has overflow-y: auto, so position:sticky here
        pins relative to the sidebar scroll container, not the viewport.
      */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg-page)",
          paddingBottom: "12px",
          marginBottom: "4px",
        }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between py-2">
          <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            <SlidersHorizontal size={13} />
            Filters
            {appliedCount > 0 && (
              <span
                className="grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                {appliedCount}
              </span>
            )}
          </span>
          {onClose && (
            <button type="button" className="rounded p-1" style={{ color: "var(--text-tertiary)" }} onClick={onClose}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Action buttons — always visible */}
        <div className="flex gap-2">
          {totalActive > 0 && (
            <button
              type="button"
              className="flex-1 rounded py-2 text-[12px] font-medium transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                background: "var(--bg-white)",
                color: "var(--text-secondary)",
              }}
              onClick={reset}
            >
              Reset all
            </button>
          )}
          <button
            type="button"
            className="flex-1 rounded py-2 text-[12px] font-semibold transition-opacity"
            style={{
              background: isDirty ? "var(--accent)" : "var(--bg-elev)",
              color: isDirty ? "#fff" : "var(--text-tertiary)",
              cursor: isDirty ? "pointer" : "default",
            }}
            disabled={!isDirty}
            onClick={apply}
          >
            Apply filters
          </button>
        </div>

        {/* Divider below header */}
        <div style={{ borderBottom: "1px solid var(--border-default)", marginTop: "12px" }} />
      </div>

      {/* Filter cards — scroll naturally inside the sidebar */}
      <div className="flex flex-col gap-3 pb-4">

        {/* Sort */}
        <div className="card-soft px-4 py-3">
          <p className="mb-2.5 text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Sort by</p>
          <div className="space-y-2">
            {[{ value: "newest", label: "Newest first" }, { value: "deadline", label: "Deadline soonest" }].map(({ value, label }) => (
              <label key={value} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="sort"
                  className="h-4 w-4 shrink-0"
                  style={{ accentColor: "var(--accent)" }}
                  checked={staged.sort === value}
                  onChange={() => setStaged((p) => ({ ...p, sort: value }))}
                />
                <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <FilterCard title="Location" selectedCount={staged.locations.length} onClearSection={() => clearSection("locations")}>
          <CheckboxList options={LOCATIONS} selected={staged.locations} onToggle={(v) => toggle("locations", v)} />
        </FilterCard>

        {industries.length > 0 && (
          <FilterCard title="Industry" selectedCount={staged.industries.length} onClearSection={() => clearSection("industries")}>
            <CheckboxList options={industries} selected={staged.industries} onToggle={(v) => toggle("industries", v)} />
          </FilterCard>
        )}

        <FilterCard title="Employment type" selectedCount={staged.employmentTypes.length} onClearSection={() => clearSection("employmentTypes")}>
          <CheckboxList options={EMPLOYMENT_TYPES} selected={staged.employmentTypes} onToggle={(v) => toggle("employmentTypes", v)} />
        </FilterCard>

        <FilterCard title="Experience" selectedCount={staged.experiences.length} onClearSection={() => clearSection("experiences")}>
          <CheckboxList options={EXPERIENCE_LEVELS} selected={staged.experiences} onToggle={(v) => toggle("experiences", v)} />
        </FilterCard>

        {!olderTab && (
          <FilterCard title="Posted within" selectedCount={staged.freshness.length} onClearSection={() => clearSection("freshness")}>
            <CheckboxList
              options={FRESHNESS_OPTIONS.map((o) => o.label)}
              selected={staged.freshness.map((v) => FRESHNESS_OPTIONS.find((o) => o.value === v)?.label).filter(Boolean)}
              onToggle={(label) => {
                const opt = FRESHNESS_OPTIONS.find((o) => o.label === label);
                if (opt) toggle("freshness", opt.value);
              }}
            />
          </FilterCard>
        )}

        <FilterCard title="Gender" selectedCount={staged.genders.length} onClearSection={() => clearSection("genders")}>
          <CheckboxList options={GENDERS} selected={staged.genders} onToggle={(v) => toggle("genders", v)} />
        </FilterCard>

        {nationalities.length > 0 && (
          <FilterCard title="Nationality" selectedCount={staged.nationalities.length} onClearSection={() => clearSection("nationalities")}>
            <CheckboxList options={nationalities} selected={staged.nationalities} onToggle={(v) => toggle("nationalities", v)} />
          </FilterCard>
        )}

      </div>
    </div>
  );
}
