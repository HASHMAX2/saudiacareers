import { useEffect, useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const REASON_LABELS = {
  MISLEADING_SALARY: "Misleading salary",
  SUSPICIOUS_CONTACT: "Suspicious contact info",
  DUPLICATE_LISTING: "Duplicate listing",
  SCAM_OR_FRAUD: "Scam or fraud",
  OTHER: "Other",
};

export function JobsFlagged() {
  const [jobs, setJobs] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await adminApi.flaggedJobs();
    setJobs(data.data);
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(job) {
    if (!window.confirm(`Remove "${job.title}"? This cannot be undone.`)) return;
    setBusyId(job.id);
    setError("");
    try {
      await adminApi.deleteJob(job.id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to remove job");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDismiss(job) {
    setBusyId(job.id);
    setError("");
    try {
      await adminApi.dismissJobReports(job.id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to dismiss reports");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Flagged by candidates</h1>
      <p className="mt-2 mb-7 text-base" style={{ color: "var(--text-secondary)" }}>
        Jobs candidates have reported. Remove genuinely bad listings; dismiss if the report doesn&apos;t hold up.
      </p>

      {error && <Alert>{error}</Alert>}

      {!jobs ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading flagged jobs" /></div>
      ) : !jobs.length ? (
        <div className="card-soft grid min-h-56 place-items-center p-8 text-center">
          <div>
            <ShieldAlert className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>Nothing flagged</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>No candidate reports are currently open.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card-soft p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.companyName} · {job.location}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="red">{job._count.reports} report{job._count.reports !== 1 ? "s" : ""}</Badge>
                    {[...new Set(job.reports.map((r) => r.reason))].map((reason) => (
                      <Badge key={reason} tone="amber">{REASON_LABELS[reason] ?? reason}</Badge>
                    ))}
                  </div>
                  {job.reports[0]?.note && (
                    <p className="mt-2 text-xs italic" style={{ color: "var(--text-tertiary)" }}>
                      &quot;{job.reports[0].note}&quot; — most recent, {formatDate(job.reports[0].createdAt)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button size="sm" variant="secondary" disabled={busyId === job.id} onClick={() => handleDismiss(job)}>
                    Dismiss
                  </Button>
                  <Button size="sm" variant="danger" disabled={busyId === job.id} onClick={() => handleRemove(job)}>
                    <Trash2 size={13} />Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
