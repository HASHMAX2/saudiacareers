export function Input({ label, error, id, required, className = "", ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label ? (
        <span className="field-label">
          {label}
          {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
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
