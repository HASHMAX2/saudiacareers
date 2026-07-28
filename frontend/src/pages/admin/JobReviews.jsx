import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, ShieldAlert } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const REASON_LABELS = {
  HR_EMAIL_FREE_WEBMAIL: "HR email uses a free webmail provider",
  HR_EMAIL_DOMAIN_MISMATCH: "HR email domain doesn't match the company website",
  APPLY_EMAIL_FREE_WEBMAIL: "Apply email uses a free webmail provider",
  APPLY_EMAIL_DOMAIN_MISMATCH: "Apply email domain doesn't match the company website",
  EXTERNAL_APPLY_URL_UNRECOGNIZED_DOMAIN: "External apply URL points to an unrecognized domain",
  PAYMENT_FEE_LANGUAGE: "Mentions a fee, deposit, or payment from the candidate",
  OFF_PLATFORM_CONTACT_PRESSURE: "Pushes candidates to WhatsApp/Telegram",
  TOO_GOOD_TO_BE_TRUE_COMPENSATION: "Compensation claims look too good to be true",
  SUSPICIOUS_SALARY_CONTENT: "Salary field contains a link or phone number",
  RAPID_DUPLICATE_POSTINGS: "Same employer posted this near-duplicate multiple times today",
};

export function JobReviews() {
  const [jobs, setJobs] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function load() {
    // New submissions and job-update revisions are two distinct statuses,
    // but they share a single review queue — approve/reject work the same
    // way for both (approveJobReview branches internally on revisesJobId).
    try {
      const [newSubmissions, revisions] = await Promise.all([
        adminApi.jobs({ status: "PENDING_REVIEW", page: 1, limit: 50 }),
        adminApi.jobs({ status: "REVISION_PENDING_APPROVAL", page: 1, limit: 50 }),
      ]);
      const merged = [...newSubmissions.data.data.jobs, ...revisions.data.data.jobs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJobs(merged);
      setLoadError("");
    } catch (requestError) {
      setLoadError(requestError.response?.data?.message ?? "Unable to load job reviews");
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    setBusyId(id);
    setBusyAction("approve");
    setError("");
    try {
      await adminApi.approveJobReview(id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to approve");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function reject(id) {
    const note = window.prompt("Reason for rejection (shown to the employer):");
    if (!note) return;
    setBusyId(id);
    setBusyAction("reject");
    setError("");
    try {
      await adminApi.rejectJobReview(id, note);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to reject");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Job reviews</h1>
      <p className="mt-2 mb-7 text-base" style={{ color: "var(--text-secondary)" }}>
        New submissions flagged by the legitimacy check, plus edits to already-live jobs awaiting approval.
        Approving a new submission publishes it (consumes a credit); approving an edit merges it into the live
        job (no credit consumed). Rejecting either keeps things as they were — the live job, if any, is untouched.
      </p>

      {error && <Alert>{error}</Alert>}
      {loadError && jobs && <Alert>{loadError}</Alert>}

      {!jobs ? (
        loadError ? (
          <div className="card-soft grid min-h-56 place-items-center p-8 text-center">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{loadError}</p>
              <Button className="mt-4" variant="secondary" onClick={() => load()}>Retry</Button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center"><Spinner label="Loading job reviews" /></div>
        )
      ) : !jobs.length ? (
        <div className="card-soft grid min-h-56 place-items-center p-8 text-center">
          <div>
            <ShieldAlert className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>Nothing pending</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>No jobs are currently flagged for review.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card-soft p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone={job.revisesJobId ? "blue" : "amber"}>
                      {job.revisesJobId ? "Job update" : "New submission"}
                    </Badge>
                    {job.revisesJobId && (
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        of &quot;{job.revisesJob?.title ?? `job #${job.revisesJobId}`}&quot;
                      </span>
                    )}
                  </div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.companyName} · {job.location}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>Submitted {formatDate(job.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button size="sm" variant="secondary" onClick={() => toggleExpanded(job.id)}>
                    {expandedIds.has(job.id) ? <><ChevronUp size={14} />Hide details</> : <><ChevronDown size={14} />View details</>}
                  </Button>
                  <Button size="sm" disabled={busyId === job.id} onClick={() => approve(job.id)}>
                    {busyId === job.id && busyAction === "approve"
                      ? <><Loader2 size={14} className="animate-spin shrink-0" />Approving…</>
                      : "Approve"}
                  </Button>
                  <Button size="sm" variant="danger" disabled={busyId === job.id} onClick={() => reject(job.id)}>
                    {busyId === job.id && busyAction === "reject"
                      ? <><Loader2 size={14} className="animate-spin shrink-0" />Rejecting…</>
                      : "Reject"}
                  </Button>
                </div>
              </div>
              {job.flagReasons?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.flagReasons.map((reason) => (
                    <Badge key={reason} tone="amber">{REASON_LABELS[reason] ?? reason}</Badge>
                  ))}
                </div>
              )}
              {expandedIds.has(job.id) && (
                <div className="mt-4 space-y-3 rounded-xl p-4 text-sm" style={{ background: "var(--bg-elev)" }}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                    <Field label="Industry" value={job.industry} />
                    <Field label="Employment type" value={job.employmentType} />
                    <Field label="Experience required" value={job.experienceRequired} />
                    <Field label="Salary range" value={job.salaryRange || "Not specified"} />
                    <Field label="HR email" value={job.hrEmail} />
                    <Field label="Application deadline" value={job.applicationDeadline ? formatDate(job.applicationDeadline) : "None"} />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Required skills</p>
                    <p className="mt-1" style={{ color: "var(--text-primary)" }}>{job.requiredSkills}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Description</p>
                    <p className="mt-1 whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{job.description}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}
