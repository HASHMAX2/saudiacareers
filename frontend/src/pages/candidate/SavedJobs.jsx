import { useEffect, useState } from "react";
import { Banknote, Bookmark, MapPin, X } from "lucide-react";
import { Link } from "react-router-dom";
import { savedJobsApi } from "../../api/savedJobs.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { useSavedJobsStore } from "../../store/savedJobsStore.js";
import { formatDate } from "../../utils/formatDate.js";

function statusBadge(job) {
  if (job.isDeleted)                return <Badge tone="red">Job removed</Badge>;
  if (job.status === "INACTIVE")    return <Badge tone="amber">Inactive</Badge>;
  if (job.isClosed)                 return <Badge tone="amber">Expired</Badge>;
  return null;
}

export function SavedJobs() {
  const { remove } = useSavedJobsStore();
  const [jobs, setJobs] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    savedJobsApi.getAll().then(({ data }) => setJobs(data.data));
  }, []);

  async function handleRemove(jobId) {
    setRemoving(jobId);
    try {
      await savedJobsApi.unsave(jobId);
      remove(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } finally {
      setRemoving(null);
    }
  }

  if (!jobs) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading saved jobs" /></div>;

  const unavailable = jobs.filter((j) => j.isDeleted || j.status === "INACTIVE" || j.isClosed);
  const active      = jobs.filter((j) => !j.isDeleted && j.status !== "INACTIVE" && !j.isClosed);

  return (
    <div>
      <p className="section-label">Candidate</p>
      <h1 className="page-title text-3xl md:text-4xl">Saved jobs</h1>
      <p className="mt-2 mb-7 text-base" style={{ color: "var(--text-secondary)" }}>
        Roles you bookmarked. Expired or inactive listings are kept so you can track them.
      </p>

      {!jobs.length ? (
        <div className="grid min-h-56 place-items-center rounded-2xl p-8 text-center" style={{ border: "1.5px dashed var(--border-strong)" }}>
          <div>
            <Bookmark className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>No saved jobs yet</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Tap the bookmark icon on any job to save it here.
            </p>
            <Link
              to="/jobs"
              className="btn-primary mt-5 inline-flex"
              style={{ minHeight: "40px", padding: "0 20px", fontSize: "14px" }}
            >
              Browse roles
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active jobs first */}
          {active.map((job) => <SavedJobCard key={job.id} job={job} removing={removing === job.id} onRemove={handleRemove} />)}

          {/* Unavailable jobs section */}
          {unavailable.length > 0 && (
            <>
              <div className="pt-2 pb-1">
                <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  No longer available ({unavailable.length})
                </p>
              </div>
              {unavailable.map((job) => <SavedJobCard key={job.id} job={job} removing={removing === job.id} onRemove={handleRemove} dimmed />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SavedJobCard({ job, removing, onRemove, dimmed = false }) {
  const badge = statusBadge(job);
  const isViewable = !job.isDeleted;
  const skills = job.requiredSkills
    ? job.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [];

  return (
    <article
      className="card-soft p-5 sm:p-6"
      style={{ opacity: dimmed ? 0.7 : 1, transition: "opacity 0.2s" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {badge}
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
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isViewable && (
            <Link
              to={`/jobs/${job.id}`}
              className="btn-primary shrink-0"
              style={{ minHeight: "34px", padding: "0 14px", fontSize: "13px" }}
            >
              View role
            </Link>
          )}
          <button
            type="button"
            aria-label="Remove from saved"
            disabled={removing}
            onClick={() => onRemove(job.id)}
            className="grid h-[34px] w-[34px] place-items-center rounded-full transition-colors hover:bg-red-50"
            style={{ border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}
          >
            {removing ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <X size={14} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isViewable ? (
          <Link
            className="hover:opacity-70 transition-opacity"
            style={{ fontSize: "18px", fontWeight: 600, lineHeight: 1.3, color: dimmed ? "var(--text-secondary)" : "var(--text-primary)" }}
            to={`/jobs/${job.id}`}
          >
            {job.title}
          </Link>
        ) : (
          <p style={{ fontSize: "18px", fontWeight: 600, lineHeight: 1.3, color: "var(--text-tertiary)" }}>
            {job.title}
          </p>
        )}
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-secondary)" }}>{job.companyName}</p>
      </div>

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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => <span key={skill} className="chip">{skill}</span>)}
        </div>
        <span className="shrink-0 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
          Saved {formatDate(job.savedAt)}
        </span>
      </div>
    </article>
  );
}
