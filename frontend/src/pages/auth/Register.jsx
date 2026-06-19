import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { AuthShell } from "../../components/auth/AuthShell.jsx";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { useAuthStore } from "../../store/authStore.js";

export function Register() {
  const [form, setForm] = useState({ name: "", email: "", mobile: "+966", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function submit(event) {
    event.preventDefault();
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
      footer={<p className="mt-6 text-center text-sm text-slate-600">Already have an account? <Link className="font-semibold text-brand-700 hover:underline" to="/login">Log in</Link></p>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input autoComplete="name" id="name" label="Full name" placeholder="Your full name" value={form.name} onChange={update("name")} required />
        <Input autoComplete="email" id="email" label="Email address" placeholder="you@example.com" type="email" value={form.email} onChange={update("email")} required />
        <Input autoComplete="tel" id="mobile" label="Saudi mobile" value={form.mobile} onChange={update("mobile")} required />
        <div><Input autoComplete="new-password" id="password" label="Password" placeholder="At least 8 characters" type="password" value={form.password} onChange={update("password")} required /><p className="mt-1.5 text-xs text-slate-500">Use at least 8 characters with one uppercase letter and one number.</p></div>
        {error && <Alert>{error}</Alert>}
        <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Creating account..." : "Create account"}</Button>
      </form>
    </AuthShell>
  );
}
