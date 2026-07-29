import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function Input({ label, labelHint, error, id, required, className = "", type, ...props }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";

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
      <div className={isPassword ? "relative" : undefined}>
        <input
          id={id}
          type={isPassword ? (showPwd ? "text" : "password") : type}
          required={required}
          aria-invalid={Boolean(error)}
          className={`field-box ${error ? "border-red-400" : ""} ${isPassword ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}
      </div>
      {error ? <span className="mt-1.5 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
