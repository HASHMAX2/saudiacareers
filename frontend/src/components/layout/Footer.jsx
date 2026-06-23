import { Link } from "react-router-dom";

const linkCls = "text-sm transition-colors hover:text-[var(--accent)]";

export function Footer() {
  return (
    <footer className="mt-16" style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-elev)" }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link className="flex items-center gap-2" to="/">
              <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white" style={{ background: "var(--accent)" }}>S</span>
              <span className="font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif", color: "var(--text-primary)" }}>SaudiaCareers</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              Connecting professionals with trusted career opportunities across Saudi Arabia.
            </p>
          </div>
          <div>
            <p className="section-label">Candidates</p>
            <ul className="space-y-2.5" style={{ color: "var(--text-secondary)" }}>
              <li><Link className={linkCls} to="/jobs">Browse jobs</Link></li>
              <li><Link className={linkCls} to="/register">Create profile</Link></li>
              <li><Link className={linkCls} to="/login">Log in</Link></li>
            </ul>
          </div>
          <div>
            <p className="section-label">Admin</p>
            <ul className="space-y-2.5" style={{ color: "var(--text-secondary)" }}>
              <li><Link className={linkCls} to="/admin/login">Admin login</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between gap-4 pt-6" style={{ borderTop: "1px solid var(--border-default)" }}>
          <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
            © {new Date().getFullYear()} SaudiaCareers. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
