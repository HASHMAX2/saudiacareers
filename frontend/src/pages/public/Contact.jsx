import { useState } from "react";
import { CheckCircle2, Mail, MessageSquare } from "lucide-react";
import { enquiryApi } from "../../api/employer.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  if (!form.subject.trim()) errors.subject = "Subject is required.";
  else if (form.subject.trim().length < 3) errors.subject = "Subject must be at least 3 characters.";
  if (!form.message.trim()) errors.message = "Message is required.";
  else if (form.message.trim().length < 10) errors.message = "Message must be at least 10 characters.";
  return errors;
}

export function Contact() {
  const [form, setForm]         = useState({ name: "", email: "", company: "", subject: "", message: "" });
  const [fieldErrors, setFE]    = useState({});
  const [error, setError]       = useState("");
  const [submitting, setSub]    = useState(false);
  const [submitted, setDone]    = useState(false);

  const update = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setFE((prev) => ({ ...prev, [key]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) { setFE(errors); return; }
    setError("");
    setSub(true);
    try {
      const payload = { ...form };
      if (!payload.company) delete payload.company;
      await enquiryApi.submit(payload);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to send. Please try again.");
    } finally {
      setSub(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className="section-label">Get in touch</p>
        <h1
          className="text-balance"
          style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.01em", color: "var(--text-primary)" }}
        >
          Contact us
        </h1>
        <p className="mt-3 text-[18px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {"Employers, partners, or anyone with a question — we're here."}
        </p>
      </div>

      {submitted ? (
        <div className="card-soft flex flex-col items-center gap-4 py-16 text-center">
          <CheckCircle2 size={48} style={{ color: "var(--accent)" }} />
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Message sent!</h2>
          <p style={{ color: "var(--text-secondary)" }}>{"We'll get back to you as soon as possible."}</p>
          <button
            type="button"
            className="mt-2 text-sm font-semibold hover:underline"
            style={{ color: "var(--accent)" }}
            onClick={() => { setDone(false); setForm({ name: "", email: "", company: "", subject: "", message: "" }); }}
          >
            Send another message
          </button>
        </div>
      ) : (
        <div className="card-soft p-6 sm:p-8">
          <div className="mb-6 flex gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-2"><Mail size={15} style={{ color: "var(--accent)" }} /> admin@saudiacareers.com</span>
            <span className="flex items-center gap-2"><MessageSquare size={15} style={{ color: "var(--accent)" }} /> Usually responds within 24 hrs</span>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="contact-name" label="Your name" required placeholder="Full name" value={form.name} onChange={update("name")} error={fieldErrors.name} />
              <Input id="contact-email" label="Email address" type="email" required placeholder="you@example.com" value={form.email} onChange={update("email")} error={fieldErrors.email} />
            </div>
            <Input id="contact-company" label="Company (optional)" placeholder="Your company" value={form.company} onChange={update("company")} />
            <Input id="contact-subject" label="Subject" required placeholder="What is this about?" value={form.subject} onChange={update("subject")} error={fieldErrors.subject} />
            <div>
              <label htmlFor="contact-message">
                <span className="field-label">Message <span className="text-red-500" aria-hidden="true">*</span></span>
              </label>
              <textarea
                id="contact-message"
                className={`field-box min-h-36 resize-y ${fieldErrors.message ? "border-red-400" : ""}`}
                placeholder="Tell us how we can help…"
                value={form.message}
                onChange={update("message")}
              />
              {fieldErrors.message && <span className="mt-1 block text-xs text-red-600">{fieldErrors.message}</span>}
            </div>
            {error && <Alert>{error}</Alert>}
            <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Sending…" : "Send message"}</Button>
          </form>
        </div>
      )}
    </section>
  );
}
