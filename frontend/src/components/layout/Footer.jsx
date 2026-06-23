import { Link } from "react-router-dom";

const linkCls = "text-[15px] transition-colors hover:text-[var(--accent)]";

export function Footer() {
  return (
    <footer
      className="mt-16"
      style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-base)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-3">

          {/* Brand */}
          <div>
            <Link className="flex items-center gap-2.5" to="/">
              <span
                className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white shrink-0"
                style={{ background: "#141414" }}
              >
                S
              </span>
              <span className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>
                SaudiaCareers
              </span>
            </Link>
            <p
              className="mt-4 text-[15px] leading-6 max-w-[320px]"
              style={{ color: "var(--text-secondary)" }}
            >
              A career platform that respects your time. Curated roles across Saudi Arabia, no spam.
            </p>
          </div>

          {/* For Talent */}
          <div>
            <p className="section-label">For Talent</p>
            <ul className="space-y-3" style={{ color: "var(--text-secondary)" }}>
              <li><Link className={linkCls} to="/jobs">Browse roles</Link></li>
              <li><Link className={linkCls} to="/register">Build profile</Link></li>
              <li><Link className={linkCls} to="/login">Sign in</Link></li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <p className="section-label">For Employers</p>
            <ul className="space-y-3" style={{ color: "var(--text-secondary)" }}>
              <li><Link className={linkCls} to="/admin/login">Admin login</Link></li>
              <li><Link className={linkCls} to="/admin/jobs/create">Post a role</Link></li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex items-center justify-between gap-4 pt-6"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <p
            className="text-[12px] font-medium uppercase tracking-[0.08em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            © {new Date().getFullYear()} SaudiaCareers · Built with care
          </p>
        </div>
      </div>
    </footer>
  );
}
