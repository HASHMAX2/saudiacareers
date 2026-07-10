import { CheckCircle2, Sparkles } from "lucide-react";
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

  const form_ = (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input autoComplete="email" id={admin ? "admin-email" : employer ? "employer-email" : "email"} label="Email address" onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required type="email" value={form.email} />
      <div>
        <Input autoComplete="current-password" id={admin ? "admin-password" : employer ? "employer-password" : "password"} label="Password" onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" required type="password" value={form.password} />
        {!admin && <div className="mt-2 text-right"><Link className="font-mono text-xs hover:underline" style={{ color: "var(--accent)" }} to="/forgot-password">Forgot password?</Link></div>}
      </div>
      {error && <Alert>{error}</Alert>}
      <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Signing in..." : "Sign in"}</Button>
    </form>
  );

  if (!admin && !employer) {
    return (
      <div
        className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl lg:min-h-[680px] lg:grid-cols-2"
        style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
      >
        {/* Left: form */}
        <div className="p-6 sm:p-8 lg:p-12">
          <div className="mb-7">
            <h1
              className="font-bold tracking-tight"
              style={{ fontSize: "36px", letterSpacing: "-0.01em", color: "var(--text-primary)" }}
            >
              {title}
            </h1>
            <p className="mt-2 text-[15px] leading-6" style={{ color: "var(--text-secondary)" }}>
              {subtitle}
            </p>
          </div>
          {form_}
          {footer}
        </div>

        {/* Right: premium image panel, hidden below lg. self-start + a fixed height
            (matching lg:min-h-[680px]) stop this from stretching to the form's
            height — otherwise a validation error growing the left column makes
            this grow too, and object-cover zooms/crops the image. */}
        <div className="relative hidden self-start lg:block" style={{ height: "680px" }}>
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=80"
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(20,20,20,0) 35%, rgba(20,20,20,0.82) 100%)" }}
          />
          <div className="absolute bottom-9 left-9 right-9 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Sparkles size={20} />
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-snug">
              Your next role is one click away.
            </h2>
            <p className="mt-2 max-w-sm text-[14px] leading-6" style={{ color: "rgba(255,255,255,0.75)" }}>
              Track applications, save jobs, and apply in seconds — all from one profile.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                "Apply to jobs in one click",
                "Track every application status",
                "Get discovered by verified employers",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[13.5px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                  <CheckCircle2 size={15} className="shrink-0" style={{ color: "rgba(255,255,255,0.65)" }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      admin={admin}
      title={title}
      subtitle={subtitle}
      footer={footer}
    >
      {form_}
    </AuthShell>
  );
}
