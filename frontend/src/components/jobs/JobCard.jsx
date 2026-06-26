import { MapPin, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "../../utils/formatDate.js";

export function JobCard({ job }) {
  const skills = job.requiredSkills
    ? job.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [];

  return (
    <article className="card-soft p-5 sm:p-6">
      {/* Top row: meta tags + View role button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}
          >
            {job.industry}
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}
          >
            {job.employmentType}
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}
          >
            {job.experienceRequired}
          </span>
        </div>
        <Link
          to={`/jobs/${job.id}`}
          className="btn-primary shrink-0"
          style={{ minHeight: "34px", padding: "0 14px", fontSize: "13px" }}
        >
          View role
        </Link>
      </div>

      {/* Title + company */}
      <div className="mt-4">
        <Link
          className="hover:opacity-70 transition-opacity"
          style={{ fontSize: "20px", fontWeight: 600, lineHeight: 1.3, color: "var(--text-primary)" }}
          to={`/jobs/${job.id}`}
        >
          {job.title}
        </Link>
        <p className="mt-1 text-[15px]" style={{ color: "var(--text-secondary)" }}>
          {job.companyName}
        </p>
      </div>

      {/* Location + salary row */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px]" style={{ color: "var(--text-secondary)" }}>
        <span className="flex items-center gap-1.5">
          <MapPin size={13} style={{ color: "var(--text-tertiary)" }} />
          {job.location}
        </span>
        {job.salaryRange && (
          <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--text-primary)" }}>
            <Banknote size={13} style={{ color: "var(--text-tertiary)" }} />
            {job.salaryRange}
          </span>
        )}
      </div>

      {/* Skills + date footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span key={skill} className="chip">{skill}</span>
          ))}
        </div>
        <span className="shrink-0 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
          {formatDate(job.createdAt)}
        </span>
      </div>
    </article>
  );
}
