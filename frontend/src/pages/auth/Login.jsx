import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { AuthShell } from "../../components/auth/AuthShell.jsx";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { useAuthStore } from "../../store/authStore.js";

export function Login({ admin = false, employer = false }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await authApi.login(form);
      const session = data.data;
      if (admin && session.user.role !== "ADMIN") {
        await authApi.logout();
        throw new Error("This login is for administrators only");
      }
      if (employer && session.user.role !== "EMPLOYER") {
        await authApi.logout();
        throw new Error("This login is for employers only");
      }
      if (!admin && !employer && (session.user.role === "ADMIN" || session.user.role === "EMPLOYER")) {
        await authApi.logout();
        throw new Error(session.user.role === "ADMIN" ? "Use the administrator login page" : "Use the employer login page");
      }
      setSession(session);
      const forcedChange = session.user.role === "ADMIN" && session.user.mustChangePassword;
      const fallback =
        session.user.role === "ADMIN"    ? "/admin/dashboard"    :
        session.user.role === "EMPLOYER" ? "/employer/dashboard" :
                                           "/dashboard";
      navigate(forcedChange ? "/admin/change-password" : location.state?.from?.pathname ?? fallback, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? requestError.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  const title    = admin ? "Admin login" : employer ? "Employer login" : "Welcome back";
  const subtitle = admin ? "Sign in with your administrator credentials."
    : employer ? "Sign in to manage your job listings and applicants."
    : "Sign in to manage your profile and applications.";
  const footer   = admin
    ? <p className="mt-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}><Link className="font-medium" style={{ color: "var(--accent)" }} to="/login">Candidate login</Link></p>
    : employer
    ? <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>New employer? <Link className="font-semibold hover:underline" style={{ color: "var(--accent)" }} to="/employer/register">Create an employer account</Link></p>
    : <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>New to SaudiaCareers? <Link className="font-semibold hover:underline" style={{ color: "var(--accent)" }} to="/register">Create an account</Link></p>;

  return (
    <AuthShell
      admin={admin}
      title={title}
      subtitle={subtitle}
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input autoComplete="email" id={admin ? "admin-email" : employer ? "employer-email" : "email"} label="Email address" onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required type="email" value={form.email} />
        <div>
          <Input autoComplete="current-password" id={admin ? "admin-password" : employer ? "employer-password" : "password"} label="Password" onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" required type="password" value={form.password} />
          {!admin && <div className="mt-2 text-right"><Link className="font-mono text-xs hover:underline" style={{ color: "var(--accent)" }} to="/forgot-password">Forgot password?</Link></div>}
        </div>
        {error && <Alert>{error}</Alert>}
        <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Signing in..." : "Sign in"}</Button>
      </form>
    </AuthShell>
  );
}
