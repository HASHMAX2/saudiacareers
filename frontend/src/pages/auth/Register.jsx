import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { AuthShell } from "../../components/auth/AuthShell.jsx";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { isValidMobile, isStrongPassword } from "../../utils/validators.js";

function validateForm(form) {
  const errors = {};
  const name = form.name?.trim() ?? "";
  const email = form.email?.trim() ?? "";
  const mobile = form.mobile?.trim() ?? "";
  const password = form.password ?? "";

  if (!name) errors.name = "Full name is required.";
  else if (name.length < 2) errors.name = "Full name must be at least 2 characters.";
  else if (name.length > 100) errors.name = "Full name must be 100 characters or fewer.";

  if (!email) errors.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";

  if (!mobile || mobile === "+") errors.mobile = "Mobile number is required.";
  else if (!isValidMobile(mobile)) errors.mobile = "Include your country code starting with + — for example, +966512345678 for Saudi or +91XXXXXXXXXX for India.";

  if (!password) errors.password = "Password is required.";
  else if (!isStrongPassword(password)) errors.password = "Password must be at least 8 characters with one uppercase letter and one number.";

  return errors;
}

export function Register() {
  const [form, setForm] = useState({ name: "", email: "", mobile: "+", password: "" });
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

  async function submit(event) {
    event.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError("");
    setSubmitting(true);
    try {
      const { data } = await authApi.register(form);
      setSession(data.data);
      navigate("/dashboard/profile");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your profile"
      subtitle="Join SaudiaCareers and apply to opportunities with one professional profile."
      footer={<p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>Already have an account? <Link className="font-semibold hover:underline" style={{ color: "var(--accent)" }} to="/login">Log in</Link></p>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input autoComplete="name" id="name" label="Full name" placeholder="Your full name" value={form.name} onChange={update("name")} required error={fieldErrors.name} />
        <Input autoComplete="email" id="email" label="Email address" placeholder="you@example.com" type="email" value={form.email} onChange={update("email")} required error={fieldErrors.email} />
        <div>
          <Input autoComplete="tel" id="mobile" label="Mobile" placeholder="+966512345678" value={form.mobile} onChange={update("mobile")} required error={fieldErrors.mobile} />
          <p className="mt-1.5 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Include your country code, e.g. +966 for Saudi Arabia.</p>
        </div>
        <div>
          <Input autoComplete="new-password" id="password" label="Password" placeholder="At least 8 characters" type="password" value={form.password} onChange={update("password")} required error={fieldErrors.password} />
          <p className="mt-1.5 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Use at least 8 characters with one uppercase letter and one number.</p>
        </div>
        {error && <Alert>{error}</Alert>}
        <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Creating account..." : "Create account"}</Button>
      </form>
    </AuthShell>
  );
}
