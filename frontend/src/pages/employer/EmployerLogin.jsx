import { Eye, EyeOff, Briefcase, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { isCompanyEmail } from "../../utils/validators.js";

const EMP = "#0F6E56";
const REMEMBER_KEY = "emp_remember_email";

function validate(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  else if (!isCompanyEmail(form.email)) errors.email = "Please use a company email address.";
  if (!form.password) errors.password = "Password is required.";
  return errors;
}

export function EmployerLogin() {
  const [form, setForm]           = useState({ email: "", password: "" });
  const [fieldErrors, setFE]      = useState({});
  const [error, setError]         = useState("");
  const [submitting, setSub]      = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [rememberMe, setRemember] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate   = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) setForm((f) => ({ ...f, email: saved }));
  }, []);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFE((p) => ({ ...p, [key]: undefined }));
    setError("");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) { setFE(errors); return; }
    setError("");
    setSub(true);
    try {
      const { data } = await authApi.login(form);
      const session  = data.data;
      if (session.user.role !== "EMPLOYER") {
        await authApi.logout();
        throw new Error("This portal is for employers only.");
      }
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, form.email);
      else localStorage.removeItem(REMEMBER_KEY);
      setSession(session);
      navigate("/employer/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? "Login failed. Please try again.");
    } finally {
      setSub(false);
    }
  }

  return (
    <div
      className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl lg:grid-cols-[1fr_1.25fr]"
      style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
    >
      {/* Left brand panel */}
      <div
        className="hidden flex-col justify-between p-10 text-white lg:flex"
        style={{ background: EMP }}
      >
        <Link className="flex items-center gap-2.5 text-white" to="/">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-sm font-bold">S</span>
          <span className="text-[20px] font-bold">SaudiaCareers</span>
        </Link>

        <div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            <Briefcase size={23} />
          </span>
          <h2 className="mt-5 text-2xl font-bold leading-snug">
            Post jobs. Find the right talent.
          </h2>
          <p className="mt-3 text-[15px] leading-6" style={{ color: "rgba(255,255,255,0.70)" }}>
            Reach thousands of qualified candidates across Saudi Arabia. Manage applications all in one place.
          </p>
          <ul className="mt-6 space-y-2.5">
            {[
              "Reach thousands of qualified candidates",
              "Manage all applicants in one place",
              "Post your first job in minutes",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[14px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                <CheckCircle2 size={16} className="shrink-0" style={{ color: "rgba(255,255,255,0.6)" }} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          © {new Date().getFullYear()} SaudiaCareers
        </p>
      </div>

      {/* Right form panel */}
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="mb-7">
          <span
            className="mb-3 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: "#E8F5F1", color: EMP }}
          >
            Employer portal
          </span>
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: "36px", letterSpacing: "-0.01em", color: "var(--text-primary)" }}
          >
            Employer login
          </h1>
          <p className="mt-2 text-[15px] leading-6" style={{ color: "var(--text-secondary)" }}>
            Sign in to manage your job listings and applicants.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Company email */}
          <label className="block" htmlFor="emp-login-email">
            <span className="field-label">
              Company email <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
            </span>
            <input
              id="emp-login-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={update("email")}
              aria-invalid={Boolean(fieldErrors.email)}
              className={`field-box ${fieldErrors.email ? "border-red-400" : ""}`}
            />
            {fieldErrors.email && (
              <span className="mt-1.5 block text-xs text-red-600">{fieldErrors.email}</span>
            )}
          </label>

          {/* Password with show/hide */}
          <div>
            <label className="block" htmlFor="emp-login-password">
              <span className="field-label">
                Password <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
              </span>
            </label>
            <div className="relative">
              <input
                id="emp-login-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={update("password")}
                aria-invalid={Boolean(fieldErrors.password)}
                className={`field-box pr-11 ${fieldErrors.password ? "border-red-400" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-opacity hover:opacity-70"
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{ color: "var(--text-tertiary)" }}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="mt-1.5 block text-xs text-red-600">{fieldErrors.password}</span>
            )}
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded"
                style={{ accentColor: EMP }}
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="font-mono text-xs hover:underline"
              style={{ color: EMP }}
            >
              Forgot password?
            </Link>
          </div>

          {error && <Alert>{error}</Alert>}

          <Button
            className="w-full"
            disabled={submitting}
            type="submit"
            style={submitting ? {} : { background: EMP, borderColor: EMP }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>
            {"Don't have an account? "}
            <Link className="font-semibold hover:underline" style={{ color: EMP }} to="/employer/register">
              Register here
            </Link>
          </p>
          <p>
            {"Are you a job seeker? "}
            <Link className="font-semibold hover:underline" style={{ color: "var(--accent)" }} to="/login">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
