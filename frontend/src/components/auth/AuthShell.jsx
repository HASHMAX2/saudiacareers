import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function AuthShell({ admin = false, title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl lg:grid-cols-[0.85fr_1.15fr]" style={{ border: "1px solid var(--border-default)", background: "var(--bg-surface)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
      <div
        className="hidden p-10 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ background: admin ? "#1A1A19" : "var(--accent)" }}
      >
        <Link className="flex items-center gap-2 text-base font-bold" to="/" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-xs font-bold">S</span>
          SaudiaCareers
        </Link>
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ShieldCheck size={23} /></span>
          <h2 className="mt-5 text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {admin ? "Secure administrator access" : "One profile. More opportunities."}
          </h2>
          <p className="mt-3 text-sm leading-6" style={{ color: "rgba(255,255,255,0.65)" }}>
            {admin ? "Manage jobs and candidate applications from the protected admin portal." : "Create your profile, upload your resume, and apply to roles across Saudi Arabia."}
          </p>
        </div>
      </div>
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="mb-7">
          {admin && (
            <span className="mb-3 inline-flex rounded-full px-3 py-1 font-mono text-xs" style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}>
              Admin portal
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "'Cabinet Grotesk', sans-serif", color: "var(--text-primary)" }}>{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>}
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
