import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { useAuthStore } from "../../store/authStore.js";

const ACCENT = "var(--accent)";

export function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFE] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFE((p) => ({ ...p, [key]: undefined }));
    setError("");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!form.email.trim()) errors.email = "Email is required.";
    if (!form.password) errors.password = "Password is required.";
    if (Object.keys(errors).length > 0) { setFE(errors); return; }

    setError("");
    setSubmitting(true);
    try {
      const { data } = await authApi.login(form);
      const session = data.data;
      if (session.user.role !== "ADMIN") {
        await authApi.logout();
        throw new Error("This login is for administrators only.");
      }
      setSession(session);
      navigate(session.user.mustChangePassword ? "/admin/change-password" : "/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl lg:min-h-[680px] lg:grid-cols-2"
      style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
    >
      {/* Left: form */}
      <div className="p-6 sm:p-8 lg:p-12">
        <div className="mb-7">
          <span
            className="mb-3 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: "var(--accent-subtle)", color: ACCENT }}
          >
            Admin console
          </span>
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: "36px", letterSpacing: "-0.01em", color: "var(--text-primary)" }}
          >
            Administrator login
          </h1>
          <p className="mt-2 text-[15px] leading-6" style={{ color: "var(--text-secondary)" }}>
            Sign in with your administrator credentials.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            id="admin-email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@saudiacareers.com"
            value={form.email}
            onChange={update("email")}
            error={fieldErrors.email}
            required
          />

          <Input
            id="admin-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={update("password")}
            error={fieldErrors.password}
            required
          />

          {error && <Alert>{error}</Alert>}

          <Button className="w-full" disabled={submitting} type="submit" style={submitting ? {} : { background: ACCENT, borderColor: ACCENT }}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>

      {/* Right: premium image panel, hidden below lg */}
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(20,20,20,0) 35%, rgba(20,20,20,0.86) 100%)" }}
        />
        <div className="absolute bottom-9 left-9 right-9 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <ShieldCheck size={20} />
          </span>
          <h2 className="mt-4 text-2xl font-bold leading-snug">
            Protected administrator access
          </h2>
          <p className="mt-2 max-w-sm text-[14px] leading-6" style={{ color: "rgba(255,255,255,0.75)" }}>
            Review employer approvals, moderate job listings, and manage billing from one secure console.
          </p>
          <ul className="mt-5 space-y-2">
            {[
              "Approve or reject employer accounts",
              "Moderate flagged and scraped job listings",
              "Manage plans, invoices, and refunds",
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
