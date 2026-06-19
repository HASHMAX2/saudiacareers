export function Input({ label, error, id, className = "", ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label ? (
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </span>
      ) : null}
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={`form-control ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
        {...props}
      />
      {error ? <span className="mt-1.5 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
