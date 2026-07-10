import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const STATUS_LABELS = {
  PENDING_REVIEW: "Awaiting review",
  REVISION_PENDING_APPROVAL: "Update awaiting review",
  REJECTED: "Rejected",
};
const STATUS_TONES = { PENDING_REVIEW: "blue", REVISION_PENDING_APPROVAL: "blue", REJECTED: "red" };

export function EmployerPendingJobs() {
  const [jobs, setJobs] = useState(null);

  useEffect(() => {
    employerApi.listPendingJobs().then(({ data }) => setJobs(data.data));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>Pending jobs</h1>
        <p className="mt-1 text-base" style={{ color: "var(--text-secondary)" }}>
          Jobs and updates currently with our team. You can view the status here — approving or rejecting is an admin decision.
        </p>
      </div>

      {!jobs ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading pending jobs" /></div>
      ) : !jobs.length ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <Clock3 className="mx-auto" size={28} style={{ color: "var(--text-tertiary)" }} />
          <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>Nothing pending</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            New submissions and job updates awaiting admin review will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONES[job.status]}>{STATUS_LABELS[job.status] ?? job.status}</Badge>
                    {job.revisesJobId && (
                      <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                        Update to &quot;{job.revisesJob?.title ?? "a live job"}&quot;
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</h2>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>{job.companyName} · {job.location}</p>
                </div>
                <p className="shrink-0 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                  Submitted {formatDate(job.createdAt)}
                </p>
              </div>

              {job.status === "REJECTED" && job.reviewNote && (
                <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                  <strong>Rejection reason:</strong> {job.reviewNote}
                </div>
              )}

              {job.flagReasons?.length > 0 && job.status !== "REJECTED" && (
                <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Flagged for: {job.flagReasons.join(", ")}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
