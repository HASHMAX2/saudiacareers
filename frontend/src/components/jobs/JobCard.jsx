import { MapPin, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "../../utils/formatDate.js";

export function JobCard({ job }) {
  const skills = job.requiredSkills
    ? job.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <article className="card-soft flex flex-col p-7">
      {/* Eyebrow row */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {job.industry}
        </span>
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {job.experienceRequired}
        </span>
      </div>

      {/* Title */}
      <Link
        className="line-clamp-2 hover:opacity-70 transition-opacity"
        style={{ fontSize: "22px", fontWeight: 600, lineHeight: 1.3, color: "var(--text-primary)" }}
        to={`/jobs/${job.id}`}
      >
        {job.title}
      </Link>

      {/* Company */}
      <p className="mt-2 text-[16px]" style={{ color: "var(--text-secondary)" }}>
        {job.companyName}
      </p>

      {/* Location + salary */}
      <div className="mt-4 flex items-center justify-between gap-3 text-[14px]">
        <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
          <MapPin size={14} style={{ color: "var(--text-tertiary)" }} />
          {job.location}
        </span>
        {job.salaryRange && (
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {job.salaryRange}
          </span>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="chip">{skill}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        className="mt-auto pt-5 flex items-center justify-between gap-4"
        style={{ borderTop: "1px solid var(--border-default)", marginTop: "20px" }}
      >
        <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          {formatDate(job.createdAt)}
        </span>
        {job.isClosed ? (
          <span
            className="text-[13px] font-medium rounded-full px-3 py-1"
            style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}
          >
            Closed
          </span>
        ) : (
          <Link
            to={`/jobs/${job.id}`}
            className="btn-primary"
            style={{ minHeight: "36px", padding: "0 16px", fontSize: "13px" }}
          >
            View role
          </Link>
        )}
      </div>
    </article>
  );
}
