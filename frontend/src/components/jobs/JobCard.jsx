import { Banknote, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../common/Badge.jsx";
import { formatDate } from "../../utils/formatDate.js";

export function JobCard({ job }) {
  const skills = job.requiredSkills
    ? job.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <article className="card-soft fade-up flex flex-col">
      {/* Gradient top bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: job.isClosed ? "var(--bg-elev)" : "linear-gradient(90deg, var(--accent), #00a851)" }}
      />
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
              {job.industry}
            </p>
            <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{job.experienceRequired}</p>
          </div>
          {job.isClosed ? <Badge tone="red">Closed</Badge> : <Badge tone="green">Open</Badge>}
        </div>
        <Link
          className="line-clamp-2 text-lg font-semibold leading-snug transition-colors hover:text-[var(--accent)]"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif", color: "var(--text-primary)" }}
          to={`/jobs/${job.id}`}
        >
          {job.title}
        </Link>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{job.companyName}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          <span className="flex items-center gap-1.5"><MapPin size={13} />{job.location}</span>
          {job.salaryRange && <span className="flex items-center gap-1.5"><Banknote size={13} />{job.salaryRange}</span>}
        </div>
        {skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="chip text-xs">{skill}</span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-5 flex items-center justify-between gap-4" style={{ borderTop: "1px solid var(--border-default)" }}>
          <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
            {formatDate(job.createdAt)}
          </span>
          <Link
            to={`/jobs/${job.id}`}
            className={job.isClosed ? "btn-secondary text-xs px-4 py-2" : "btn-primary text-xs px-4 py-2"}
          >
            {job.isClosed ? "View details" : "View job"}
          </Link>
        </div>
      </div>
    </article>
  );
}
