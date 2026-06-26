import { Briefcase, CheckCircle2, Clock, HelpCircle, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { enquiryApi } from "../../api/employer.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { isCompanyEmail, isValidMobile } from "../../utils/validators.js";

const EMP = "#0F6E56";

const SUBJECTS = [
  "Post a Job",
  "Pricing & Plans",
  "Technical Support",
  "Partnership",
  "Other",
];

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.company.trim()) errors.company = "Company name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  else if (!isCompanyEmail(form.email)) errors.email = "Please use a company email address.";
  if (!form.phone || form.phone === "+") errors.phone = "Phone number is required.";
  else if (!isValidMobile(form.phone)) errors.phone = "Include country code e.g. +966512345678";
  if (!form.subject) errors.subject = "Please select a subject.";
  if (!form.message.trim()) errors.message = "Message is required.";
  else if (form.message.trim().length < 20) errors.message = "Message must be at least 20 characters.";
  return errors;
}

const EMPTY = { name: "", company: "", email: "", phone: "+", subject: "", message: "" };

function InfoRow({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <Icon size={17} />
      </span>
      <span className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
        {children}
      </span>
    </div>
  );
}

function CTACard({ icon: Icon, title, description, to, label }) {
  return (
    <div
      className="card-soft card-lift flex flex-col items-start gap-3 p-6"
    >
      <span
        className="grid h-10 w-10 place-items-center rounded-xl"
        style={{ background: "#E8F5F1", color: EMP }}
      >
        <Icon size={19} />
      </span>
      <div>
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{description}</p>
      </div>
      <Link
        to={to}
        className="mt-auto inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
        style={{ background: EMP }}
      >
        {label}
      </Link>
    </div>
  );
}

export function EmployerContact() {
  const [form, setForm]         = useState(EMPTY);
  const [fieldErrors, setFE]    = useState({});
  const [error, setError]       = useState("");
  const [submitting, setSub]    = useState(false);
  const [submitted, setDone]    = useState(false);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFE((p) => ({ ...p, [key]: undefined }));
  };

  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => { setDone(false); setForm(EMPTY); }, 3000);
    return () => clearTimeout(t);
  }, [submitted]);

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) { setFE(errors); return; }
    setError("");
    setSub(true);
    try {
      await enquiryApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        subject: form.subject,
        message: form.message.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to send. Please try again.");
    } finally {
      setSub(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page header */}
      <div className="mb-10">
        <p className="section-label">Employers</p>
        <h1
          className="text-balance"
          style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.01em", color: "var(--text-primary)" }}
        >
          Get in touch
        </h1>
        <p className="mt-3 text-[18px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Have questions about posting jobs or our employer plans? {"We're"} here to help.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* Left: contact info panel */}
        <div
          className="flex flex-col justify-between rounded-2xl p-8 text-white lg:p-10"
          style={{ background: EMP }}
        >
          <div className="space-y-6">
            <InfoRow icon={Mail}>
              <strong className="block text-white">employers@saudiacareers.com</strong>
              Best for account and billing questions
            </InfoRow>
            <InfoRow icon={Phone}>
              <strong className="block text-white">+966 11 000 0000</strong>
              Sun–Thu, 9am–6pm AST
            </InfoRow>
            <InfoRow icon={MapPin}>
              <strong className="block text-white">Riyadh, Saudi Arabia</strong>
              King Fahd Road, Business District
            </InfoRow>
            <InfoRow icon={Clock}>
              <strong className="block text-white">Working hours</strong>
              Mon–Fri, 9:00 am – 6:00 pm
            </InfoRow>
          </div>

          <div className="mt-8 border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
            <p className="mb-3 text-sm font-semibold text-white">Typical response time</p>
            <div
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
            >
              Within 1 business day
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="card-soft p-6 sm:p-8">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-14 text-center">
              <CheckCircle2 size={48} style={{ color: EMP }} />
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Message sent!</h2>
              <p style={{ color: "var(--text-secondary)" }}>
                {"Thank you! We've received your message and will get back to you within 1 business day."}
              </p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                This form will reset in a moment…
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="ec-name" label="Full name" required placeholder="Your full name" value={form.name} onChange={update("name")} error={fieldErrors.name} />
                <Input id="ec-company" label="Company name" required placeholder="Your company" value={form.company} onChange={update("company")} error={fieldErrors.company} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="ec-email" label="Company email" type="email" required placeholder="you@company.com" value={form.email} onChange={update("email")} error={fieldErrors.email} />
                <Input id="ec-phone" label="Phone number" required placeholder="+966512345678" value={form.phone} onChange={update("phone")} error={fieldErrors.phone} />
              </div>

              <div>
                <label className="block" htmlFor="ec-subject">
                  <span className="field-label">
                    Subject <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
                  </span>
                </label>
                <select
                  id="ec-subject"
                  className={`field-box ${fieldErrors.subject ? "border-red-400" : ""}`}
                  value={form.subject}
                  onChange={update("subject")}
                >
                  <option value="">Select a subject…</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldErrors.subject && (
                  <span className="mt-1.5 block text-xs text-red-600">{fieldErrors.subject}</span>
                )}
              </div>

              <div>
                <label htmlFor="ec-message">
                  <span className="field-label">
                    Message <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
                  </span>
                </label>
                <textarea
                  id="ec-message"
                  className={`field-box min-h-32 resize-y ${fieldErrors.message ? "border-red-400" : ""}`}
                  placeholder="Tell us how we can help…"
                  value={form.message}
                  onChange={update("message")}
                />
                {fieldErrors.message && (
                  <span className="mt-1.5 block text-xs text-red-600">{fieldErrors.message}</span>
                )}
              </div>

              {error && <Alert>{error}</Alert>}

              <Button
                className="w-full"
                disabled={submitting}
                type="submit"
                style={submitting ? {} : { background: EMP, borderColor: EMP }}
              >
                {submitting ? "Sending…" : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom CTA cards */}
      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        <CTACard
          icon={Briefcase}
          title="Post a Job"
          description="Create a listing and start receiving applications today."
          to="/employer/jobs/create"
          label="Post now"
        />
        <CTACard
          icon={HelpCircle}
          title="View FAQs"
          description="Answers to the most common employer questions."
          to="/employer/login"
          label="Browse FAQs"
        />
        <CTACard
          icon={Mail}
          title="Email us directly"
          description="Prefer email? Reach our employer team anytime."
          to="mailto:employers@saudiacareers.com"
          label="Send email"
        />
      </div>
    </div>
  );
}
