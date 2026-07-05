import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function SectionShell({ title, subtitle, viewAllTo, children, className = "" }) {
  return (
    <section
      className={`bg-white rounded-2xl p-5 sm:p-6 ${className}`}
      style={{ border: "1px solid var(--border-default)", boxShadow: "var(--sh-2)" }}
    >
      {(title || viewAllTo) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              {title}
            </h2>
            {subtitle && (
              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-tertiary)" }}>
                {subtitle}
              </div>
            )}
          </div>
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="inline-flex items-center gap-1 text-[13px] font-semibold shrink-0"
              style={{ color: "var(--accent)" }}
            >
              View all <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
