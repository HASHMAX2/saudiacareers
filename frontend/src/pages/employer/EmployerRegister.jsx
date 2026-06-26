import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { employerApi } from "../../api/employer.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { isCompanyEmail, isStrongPassword, isValidMobile } from "../../utils/validators.js";

const EMP = "#0F6E56";

const INDUSTRIES = ["Technology","Finance","Healthcare","Education","Manufacturing","Retail","Hospitality","Other"];
const SIZES       = ["1–10","11–50","51–200","201–500","500+"];

function validateStep1(form) {
  const errors = {};
  if (!form.companyName.trim()) errors.companyName = "Company name is required.";
  else if (form.companyName.trim().length < 2) errors.companyName = "Must be at least 2 characters.";
  if (!form.location.trim()) errors.location = "City / location is required.";
  if (form.website && form.website.trim()) {
    try { new URL(form.website.trim()); } catch { errors.website = "Enter a valid URL (include https://)."; }
  }
  return errors;
}

function validateStep2(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  else if (form.name.trim().length < 2) errors.name = "Must be at least 2 characters.";
  if (!form.contactDesignation.trim()) errors.contactDesignation = "Job title is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  else if (!isCompanyEmail(form.email)) errors.email = "Please use a company email address.";
  if (!form.phone || form.phone === "+") errors.phone = "Phone number is required.";
  else if (!isValidMobile(form.phone)) errors.phone = "Include country code e.g. +966512345678";
  if (!form.password) errors.password = "Password is required.";
  else if (!isStrongPassword(form.password)) {
    if (form.password.length < 8) errors.password = "Min 8 characters.";
    else if (!/[A-Z]/.test(form.password)) errors.password = "Must include an uppercase letter.";
    else errors.password = "Must include a number.";
  }
  if (form.password && form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match.";
  if (!form.agreeTerms) errors.agreeTerms = "You must agree to the Terms & Conditions.";
  return errors;
}

const EMPTY = {
  companyName: "", industry: "", companySize: "", website: "", location: "",
  name: "", contactDesignation: "", email: "", phone: "+", password: "", confirmPassword: "", agreeTerms: false,
};

export function EmployerRegister() {
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState(EMPTY);
  const [fieldErrors, setFE]    = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSub]    = useState(false);
  const [submitted, setDone]    = useState(false);

  const update = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
    setFE((p) => ({ ...p, [key]: undefined }));
  };

  function goNext(e) {
    e.preventDefault();
    const errors = validateStep1(form);
    if (Object.keys(errors).length > 0) { setFE(errors); return; }
    setFE({});
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateStep2(form);
    if (Object.keys(errors).length > 0) { setFE(errors); return; }
    setApiError("");
    setSub(true);
    try {
      const payload = {
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone !== "+" ? form.phone : undefined,
        industry: form.industry || undefined,
        location: form.location.trim() || undefined,
        website: form.website.trim() || undefined,
        companySize: form.companySize || undefined,
        contactDesignation: form.contactDesignation.trim() || undefined,
      };
      await employerApi.register(payload);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setApiError(err.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setSub(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="mx-auto max-w-xl rounded-3xl p-10 text-center"
        style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
      >
        <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full" style={{ background: "#E8F5F1" }}>
          <CheckCircle2 size={32} style={{ color: EMP }} />
        </span>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Registration successful!</h1>
        <p className="mt-3 text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Our team will verify your account and reach out within 24 hours. Once approved, you can log in and start posting jobs.
        </p>
        <Link
          to="/employer/login"
          className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: EMP }}
        >
          Go to login
        </Link>
        <p className="mt-4 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Questions? Email us at{" "}
          <a className="hover:underline" href="mailto:employers@saudiacareers.com" style={{ color: EMP }}>
            employers@saudiacareers.com
          </a>
        </p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-2xl overflow-hidden rounded-3xl"
      style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
    >
      {/* Header */}
      <div className="px-6 pb-6 pt-8 sm:px-8 sm:pt-10">
        <span
          className="mb-3 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em]"
          style={{ background: "#E8F5F1", color: EMP }}
        >
          Employer portal
        </span>
        <h1 className="text-[32px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Create employer account
        </h1>
        <p className="mt-1 text-[15px]" style={{ color: "var(--text-secondary)" }}>
          Post jobs and start receiving applications from qualified candidates.
        </p>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-3">
          {[1, 2].map((n) => (
            <div key={n} className={`flex items-center gap-2 ${n > 1 ? "flex-1" : ""}`}>
              {n > 1 && (
                <div
                  className="h-px flex-1 transition-colors duration-300"
                  style={{ background: step >= n ? EMP : "var(--border-default)" }}
                />
              )}
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors duration-300"
                style={
                  step >= n
                    ? { background: EMP, color: "white" }
                    : { background: "var(--bg-elev)", color: "var(--text-tertiary)" }
                }
              >
                {step > n ? <CheckCircle2 size={16} /> : n}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: step >= n ? "var(--text-primary)" : "var(--text-tertiary)" }}
              >
                {n === 1 ? "Company Details" : "Account Details"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t px-6 pb-8 pt-6 sm:px-8" style={{ borderColor: "var(--border-default)" }}>
        {/* ── Step 1 ── */}
        {step === 1 && (
          <form className="space-y-4" onSubmit={goNext}>
            <Input
              id="reg-companyName"
              label="Company name"
              required
              placeholder="Your company"
              value={form.companyName}
              onChange={update("companyName")}
              error={fieldErrors.companyName}
              autoComplete="organization"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block" htmlFor="reg-industry">
                  <span className="field-label">Industry</span>
                </label>
                <select
                  id="reg-industry"
                  className="field-box"
                  value={form.industry}
                  onChange={update("industry")}
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block" htmlFor="reg-size">
                  <span className="field-label">Company size</span>
                </label>
                <select
                  id="reg-size"
                  className="field-box"
                  value={form.companySize}
                  onChange={update("companySize")}
                >
                  <option value="">Select size</option>
                  {SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
            </div>

            <Input
              id="reg-location"
              label="City / Location"
              required
              placeholder="e.g. Riyadh"
              value={form.location}
              onChange={update("location")}
              error={fieldErrors.location}
            />

            <Input
              id="reg-website"
              label="Company website (optional)"
              type="url"
              placeholder="https://yourcompany.com"
              value={form.website}
              onChange={update("website")}
              error={fieldErrors.website}
              autoComplete="url"
            />

            <Button
              className="w-full"
              type="submit"
              style={{ background: EMP, borderColor: EMP }}
            >
              Next: Account Details →
            </Button>
          </form>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="reg-name"
                label="Contact person full name"
                required
                placeholder="Your full name"
                value={form.name}
                onChange={update("name")}
                error={fieldErrors.name}
                autoComplete="name"
              />
              <Input
                id="reg-designation"
                label="Designation / Job title"
                required
                placeholder="e.g. HR Manager"
                value={form.contactDesignation}
                onChange={update("contactDesignation")}
                error={fieldErrors.contactDesignation}
              />
            </div>

            <Input
              id="reg-email"
              label="Company email address"
              type="email"
              required
              placeholder="you@company.com"
              value={form.email}
              onChange={update("email")}
              error={fieldErrors.email}
              autoComplete="email"
            />

            <Input
              id="reg-phone"
              label="Phone number"
              required
              placeholder="+966512345678"
              value={form.phone}
              onChange={update("phone")}
              error={fieldErrors.phone}
              autoComplete="tel"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="reg-password"
                label="Password"
                type="password"
                required
                placeholder="Min 8 characters"
                value={form.password}
                onChange={update("password")}
                error={fieldErrors.password}
                autoComplete="new-password"
              />
              <Input
                id="reg-confirm"
                label="Confirm password"
                type="password"
                required
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                error={fieldErrors.confirmPassword}
                autoComplete="new-password"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm" htmlFor="reg-terms">
              <input
                id="reg-terms"
                type="checkbox"
                checked={form.agreeTerms}
                onChange={update("agreeTerms")}
                className="mt-0.5 h-4 w-4 shrink-0 rounded"
                style={{ accentColor: EMP }}
              />
              <span style={{ color: "var(--text-secondary)" }}>
                {"I agree to the "}
                <a href="/terms" className="font-semibold hover:underline" style={{ color: EMP }}>Terms &amp; Conditions</a>
                {" and "}
                <a href="/privacy" className="font-semibold hover:underline" style={{ color: EMP }}>Privacy Policy</a>
              </span>
            </label>
            {fieldErrors.agreeTerms && (
              <span className="block text-xs text-red-600">{fieldErrors.agreeTerms}</span>
            )}

            {apiError && <Alert>{apiError}</Alert>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(1); setFE({}); }}
                className="rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
              >
                ← Back
              </button>
              <Button
                className="flex-1"
                disabled={submitting}
                type="submit"
                style={submitting ? {} : { background: EMP, borderColor: EMP }}
              >
                {submitting ? "Creating account…" : "Create employer account"}
              </Button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Already registered?{" "}
          <Link className="font-semibold hover:underline" style={{ color: EMP }} to="/employer/login">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
