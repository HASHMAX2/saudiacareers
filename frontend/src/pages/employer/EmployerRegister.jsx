import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { employerApi } from "../../api/employer.js";
import { AuthShell } from "../../components/auth/AuthShell.jsx";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Toast } from "../../components/common/Toast.jsx";
import { useAuthStore } from "../../store/authStore.js";

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Contact name is required.";
  else if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";

  if (!form.companyName.trim()) errors.companyName = "Company name is required.";
  else if (form.companyName.trim().length < 2) errors.companyName = "Company name must be at least 2 characters.";

  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";

  if (form.phone && form.phone !== "+" && !/^\+\d{7,15}$/.test(form.phone)) {
    errors.phone = "Include country code e.g. +966512345678";
  }

  if (!form.password) errors.password = "Password is required.";
  else if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Z]/.test(form.password)) errors.password = "Password must include an uppercase letter.";
  else if (!/[0-9]/.test(form.password)) errors.password = "Password must include a number.";

  return errors;
}

export function EmployerRegister() {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "+", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  const update = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setError("");
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.phone || payload.phone === "+") delete payload.phone;
      const { data } = await employerApi.register(payload);
      const session = data.data;
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setSession(session);
        navigate("/employer/dashboard", { replace: true });
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Toast show={showToast} message="Account created! Taking you to your dashboard…" tone="success" duration={2500} />
      <AuthShell
        title="Create employer account"
        subtitle="Post jobs and manage your applicants."
        footer={
          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link className="font-semibold hover:underline" style={{ color: "var(--accent)" }} to="/employer/login">
              Sign in
            </Link>
          </p>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input id="name" label="Contact person name" placeholder="Your full name" required value={form.name} onChange={update("name")} error={fieldErrors.name} autoComplete="name" />
          <Input id="companyName" label="Company name" placeholder="Your company" required value={form.companyName} onChange={update("companyName")} error={fieldErrors.companyName} autoComplete="organization" />
          <Input id="employer-email" label="Work email" type="email" placeholder="you@company.com" required value={form.email} onChange={update("email")} error={fieldErrors.email} autoComplete="email" />
          <Input id="employer-phone" label="Phone number" placeholder="+966512345678" value={form.phone} onChange={update("phone")} error={fieldErrors.phone} autoComplete="tel" />
          <Input id="employer-password" label="Password" type="password" placeholder="At least 8 characters" required value={form.password} onChange={update("password")} error={fieldErrors.password} autoComplete="new-password" />
          {error && <Alert>{error}</Alert>}
          <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Creating account…" : "Create employer account"}</Button>
        </form>
      </AuthShell>
    </>
  );
}
