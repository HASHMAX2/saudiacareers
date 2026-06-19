import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function AuthShell({ admin = false, title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card lg:grid-cols-[0.85fr_1.15fr]">
      <div className={`${admin ? "bg-slate-900" : "bg-brand-900"} hidden p-10 text-white lg:flex lg:flex-col lg:justify-between`}>
        <Link className="text-xl font-bold" to="/">SaudiaCareers</Link>
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ShieldCheck size={23} /></span>
          <h2 className="mt-5 text-2xl font-bold">{admin ? "Secure administrator access" : "One profile. More opportunities."}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{admin ? "Manage jobs and candidate applications from the protected admin portal." : "Create your profile, upload your resume, and apply to roles across Saudi Arabia."}</p>
        </div>
      </div>
      <div className="p-5 sm:p-8 lg:p-10">
        <div className="mb-7">
          {admin && <span className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Admin portal</span>}
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>}
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
