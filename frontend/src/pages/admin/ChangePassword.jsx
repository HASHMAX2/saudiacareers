import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { isStrongPassword } from "../../utils/validators.js";

export function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  const update = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setError("");
  };

  async function handleSubmit(event) {
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
    setSubmitting(true);
    try {
      const { data } = await authApi.changePassword(form);
      setSession(data.data);
      navigate("/admin/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Password change failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <LockKeyhole size={22} />
      </span>
      <h1 className="mt-5 text-2xl font-bold">Secure your admin account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Replace the seeded password before accessing administrator features.</p>
      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <Input
          id="currentPassword"
          label="Current password"
          type="password"
          required
          value={form.currentPassword}
          error={fieldErrors.currentPassword}
          onChange={update("currentPassword")}
        />
        <div>
          <Input
            id="newPassword"
            label="New password"
            type="password"
            required
            value={form.newPassword}
            error={fieldErrors.newPassword}
            onChange={update("newPassword")}
          />
          <p className="mt-1.5 text-xs text-slate-500">At least 8 characters with one uppercase letter and one number.</p>
        </div>
        {error && <Alert>{error}</Alert>}
        <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Updating..." : "Change password"}</Button>
      </form>
    </div>
  );
}
