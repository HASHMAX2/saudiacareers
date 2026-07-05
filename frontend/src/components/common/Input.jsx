export function Input({ label, labelHint, error, id, required, className = "", ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label ? (
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
      ) : null}
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        className={`field-box ${error ? "border-red-400" : ""} ${className}`}
        {...props}
      />
      {error ? <span className="mt-1.5 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
