import { CheckCircle2, Rocket } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { PhoneInput } from "../../components/common/PhoneInput.jsx";
import { Toast } from "../../components/common/Toast.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { isValidMobile, isStrongPassword } from "../../utils/validators.js";

const REDIRECT_DELAY = 3000;

function validateForm(form) {
  const errors = {};
  const name = form.name?.trim() ?? "";
  const email = form.email?.trim() ?? "";
  const mobile = form.mobile ?? "";
  const password = form.password ?? "";

  if (!name) errors.name = "Full name is required.";
  else if (name.length < 2) errors.name = "Full name must be at least 2 characters.";
  else if (name.length > 100) errors.name = "Full name must be 100 characters or fewer.";

  if (!email) errors.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";

  if (!mobile) errors.mobile = "Mobile number is required.";
  else if (!isValidMobile(mobile)) errors.mobile = "Enter your full phone number after selecting the country code.";

  if (!password) errors.password = "Password is required.";
  else if (!isStrongPassword(password)) errors.password = "Password must be at least 8 characters with one uppercase letter and one number.";

  return errors;
}

export function Register() {
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, text: "" });
  const timerRef = useRef(null);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  useEffect(() => () => clearTimeout(timerRef.current), []);

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
      const pendingSession = data.data;
      setToast({ show: true, text: "Account created! Taking you to your profile…" });
      timerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
        setTimeout(() => {
          // PublicOnlyRoute reactively redirects authenticated users to "/dashboard" the
          // moment isAuthenticated flips true. If setSession() and navigate() aren't forced
          // into separate, ordered commits, PublicOnlyRoute's own redirect effect can fire
          // *after* our navigate() and clobber the URL back to "/dashboard" instead of
          // "/dashboard/profile". flushSync forces that stale redirect to fully resolve
          // first, so our explicit navigate() below always applies last and wins.
          flushSync(() => setSession(pendingSession));
          navigate("/dashboard/profile");
        }, 400);
      }, REDIRECT_DELAY);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <Toast show={toast.show} message={toast.text} tone="success" duration={REDIRECT_DELAY} />
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
            Create your profile
          </h1>
          <p className="mt-2 text-[15px] leading-6" style={{ color: "var(--text-secondary)" }}>
            Join SaudiaCareers and apply to opportunities with one professional profile.
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <Input autoComplete="name" id="name" label="Full name" placeholder="Your full name" value={form.name} onChange={update("name")} required error={fieldErrors.name} />
          <Input autoComplete="email" id="email" label="Email address" placeholder="you@example.com" type="email" value={form.email} onChange={update("email")} required error={fieldErrors.email} />
          <PhoneInput id="mobile" label="Mobile" value={form.mobile} onChange={update("mobile")} required error={fieldErrors.mobile} />
          <div>
            <Input autoComplete="new-password" id="password" label="Password" placeholder="At least 8 characters" type="password" value={form.password} onChange={update("password")} required error={fieldErrors.password} />
            <p className="mt-1.5 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Use at least 8 characters with one uppercase letter and one number.</p>
          </div>
          {error && <Alert>{error}</Alert>}
          <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Creating account..." : "Create account"}</Button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Already have an account? <Link className="font-semibold hover:underline" style={{ color: "var(--accent)" }} to="/login">Log in</Link>
        </p>
      </div>

      {/* Right: premium image panel, hidden below lg. self-start + a fixed height
          (matching lg:min-h-[680px]) stop this from stretching to the form's
          height — otherwise a validation error growing the left column makes
          this grow too, and object-cover zooms/crops the image. */}
      <div className="relative hidden self-start lg:block" style={{ height: "680px" }}>
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(20,20,20,0) 35%, rgba(20,20,20,0.82) 100%)" }}
        />
        <div className="absolute bottom-9 left-9 right-9 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Rocket size={20} />
          </span>
          <h2 className="mt-4 text-2xl font-bold leading-snug">
            Start your career journey today.
          </h2>
          <p className="mt-2 max-w-sm text-[14px] leading-6" style={{ color: "rgba(255,255,255,0.75)" }}>
            Create one profile and apply to verified roles across Saudi Arabia in minutes.
          </p>
          <ul className="mt-5 space-y-2">
            {[
              "Free forever for candidates",
              "One profile, unlimited applications",
              "Get matched with verified employers",
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
    </>
  );
}
