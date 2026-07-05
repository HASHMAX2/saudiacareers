import { Bookmark, Briefcase, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoTile } from "./LogoTile.jsx";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function JobRailCard({ job, index = 0, onSave }) {
  return (
    <article
      className="flex flex-col bg-white rounded-[14px] p-4 transition-all hover:shadow-lg hover:-translate-y-[3px]"
      style={{
        flex: "0 0 268px",
        scrollSnapAlign: "start",
        border: "1px solid var(--border-default)",
      }}
    >
      <LogoTile name={job.companyName} index={index} />
      <Link
        to={`/jobs/${job.id}`}
        className="mt-3 text-[15px] font-bold leading-tight hover:underline"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", minHeight: 39 }}
      >
        {job.title}
      </Link>
      <div className="mt-0.5 text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
        {job.companyName}
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
          <Briefcase size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          {job.experienceRequired}
        </div>
        <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
          <MapPin size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          {job.location}
        </div>
      </div>
      <div
        className="mt-3.5 pt-3 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--bg-elev)" }}
      >
        <span className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
          {timeAgo(job.createdAt)}
        </span>
        <button
          className="grid place-items-center transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Save job"
          onClick={onSave}
        >
          <Bookmark size={17} />
        </button>
      </div>
    </article>
  );
}
