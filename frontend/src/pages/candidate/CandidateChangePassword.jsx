import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { authApi } from "../../api/auth.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { isStrongPassword } from "../../utils/validators.js";

export function CandidateChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setError("");
    setMessage("");
  };

  async function submit(event) {
    event.preventDefault();
    const errors = {};
    if (!form.currentPassword) errors.currentPassword = "Current password is required.";
    if (!form.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (!isStrongPassword(form.newPassword)) {
      errors.newPassword = "Password must be at least 8 characters with one uppercase letter and one number.";
    } else if (form.currentPassword && form.currentPassword === form.newPassword) {
      errors.newPassword = "New password must be different from your current password.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await authApi.changePassword(form);
      setMessage("Password updated successfully.");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Password change failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
          <LockKeyhole size={18} />
        </span>
        <div>
          <h1 className="font-semibold" style={{ color: "var(--text-primary)" }}>Change password</h1>
          <p className="mt-0.5 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>Use a strong password that is different from your current password.</p>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="currentPassword"
            label="Current password"
            type="password"
            required
            value={form.currentPassword}
            error={fieldErrors.currentPassword}
            onChange={update("currentPassword")}
          />
          <Input
            id="newPassword"
            label="New password"
            type="password"
            required
            value={form.newPassword}
            error={fieldErrors.newPassword}
            onChange={update("newPassword")}
          />
        </div>
        <p className="mt-1.5 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
          At least 8 characters with one uppercase letter and one number.
        </p>
        {error && <div className="mt-4"><Alert>{error}</Alert></div>}
        {message && <div className="mt-4"><Alert tone="success">{message}</Alert></div>}
        <Button className="mt-5 w-full sm:w-auto" disabled={saving} type="submit">
          {saving ? "Saving…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
