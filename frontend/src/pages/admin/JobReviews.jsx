import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
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
  const [error, setError] = useState("");

  async function load() {
    const { data } = await adminApi.jobs({ status: "PENDING_REVIEW", page: 1, limit: 50 });
    setJobs(data.data.jobs);
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    setBusyId(id);
    setError("");
    try {
      await adminApi.approveJobReview(id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to approve");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id) {
    const note = window.prompt("Reason for rejection (shown to the employer):");
    if (!note) return;
    setBusyId(id);
    setError("");
    try {
      await adminApi.rejectJobReview(id, note);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to reject");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Job reviews</h1>
      <p className="mt-2 mb-7 text-base" style={{ color: "var(--text-secondary)" }}>
        Jobs automatically flagged by the legitimacy check. Approving publishes the job (consumes a credit); rejecting keeps it off listings.
      </p>

      {error && <Alert>{error}</Alert>}

      {!jobs ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading job reviews" /></div>
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
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.companyName} · {job.location}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>Submitted {formatDate(job.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button size="sm" disabled={busyId === job.id} onClick={() => approve(job.id)}>Approve</Button>
                  <Button size="sm" variant="danger" disabled={busyId === job.id} onClick={() => reject(job.id)}>Reject</Button>
                </div>
              </div>
              {job.flagReasons?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.flagReasons.map((reason) => (
                    <Badge key={reason} tone="amber">{REASON_LABELS[reason] ?? reason}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
