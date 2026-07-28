import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";
import { VERIFICATION_DOCUMENT_TYPES } from "../../utils/constants.js";

function documentLabel(value) {
  return VERIFICATION_DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function SlaBadge({ sla }) {
  if (sla.breached) return <Badge tone="red">Breached</Badge>;
  if (sla.hoursRemaining < 4) return <Badge tone="amber">{sla.hoursRemaining}h left</Badge>;
  return <Badge tone="green">{sla.hoursRemaining}h left</Badge>;
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl p-3" style={{ border: "1px solid var(--border-default)", background: "var(--bg-elev)" }}>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text-primary)", overflowWrap: "anywhere" }}>{value}</p>
    </div>
  );
}

function SignalRow({ label, detail, passed }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
      <div>
        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{detail}</p>
      </div>
      <Badge tone={passed ? "green" : "red"}>{passed ? "Passed" : "Missing"}</Badge>
    </div>
  );
}

export function EmployerReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await adminApi.verificationDetail(id);
    setDetail(data.data);
  }

  // Clear the previous employer's data before fetching the new one — otherwise,
  // navigating from one employer's review page straight to another's (same
  // route, different :id) leaves the old employer's document links rendered
  // and clickable for the brief window before the new fetch resolves.
  useEffect(() => {
    setDetail(null);
    setNote("");
    setError("");
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(action, actionName) {
    setBusy(true);
    setBusyAction(actionName);
    setError("");
    try {
      await action();
      navigate("/admin/verifications");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to complete action");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  if (!detail) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading employer" /></div>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="page-title text-3xl md:text-4xl">Employer review detail</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
            Single place for the approval decision: identity, domain checks, documents, first job, and reason.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/admin/verifications")}>Back to queue</Button>
          <Button disabled={busy} onClick={() => run(() => adminApi.approveVerification(id), "approve")}>
            {busyAction === "approve" ? <><Loader2 size={14} className="animate-spin shrink-0" />Approving…</> : "Approve employer"}
          </Button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] items-start">
        <div className="rounded-2xl p-6" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>{detail.companyName}</h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>{detail.industry ?? "—"} · {detail.location ?? "—"} · Submitted {formatDate(detail.sla.submittedAt)}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Company email" value={detail.user.email} />
            <DetailItem label="Website" value={detail.website || "Not provided"} />
            <DetailItem label="LinkedIn" value={detail.linkedinUrl || "Not provided"} />
            <DetailItem label="Primary contact" value={`${detail.user.name}${detail.contactDesignation ? ` · ${detail.contactDesignation}` : ""}`} />
            <DetailItem label="Phone" value={detail.phone || detail.user.mobile || "Not provided"} />
            <DetailItem label="Tax / CR number" value={detail.taxRegistrationNumber || "Not provided"} />
          </div>

          <div className="my-6 h-px" style={{ background: "var(--border-default)" }} />
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Verification signals</h3>
          <div className="mt-3">
            <SignalRow label="Company email domain match" detail="Compares the account email domain against the company website." passed={detail.signals.emailDomainMatches} />
            <SignalRow label="Website on file" detail="A live company website or official page." passed={detail.signals.hasWebsite} />
            <SignalRow label="LinkedIn company page" detail="Useful for verification but not always required." passed={detail.signals.hasLinkedIn} />
            <SignalRow label="Verification documents" detail="Required before approval." passed={detail.signals.hasDocument} />
          </div>
          {detail.documents.length > 0 && (
            <div className="mt-3 space-y-2">
              {detail.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl p-3 text-sm hover:bg-[var(--bg-elev)]"
                  style={{ border: "1px solid var(--border-default)" }}
                >
                  <span className="truncate font-medium" style={{ color: "var(--text-primary)" }} title={documentLabel(doc.documentType)}>
                    {documentLabel(doc.documentType)}
                  </span>
                  <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--accent)" }}>View →</span>
                </a>
              ))}
            </div>
          )}

          {detail.firstJob && (
            <>
              <div className="my-6 h-px" style={{ background: "var(--border-default)" }} />
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>First job draft</h3>
              <div className="mt-3 rounded-xl p-4 text-sm" style={{ background: "var(--bg-elev)", color: "var(--text-secondary)" }}>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>{detail.firstJob.title}</p>
                <p className="mt-1">{detail.firstJob.location} · {detail.firstJob.employmentType} {detail.firstJob.salaryRange ? `· ${detail.firstJob.salaryRange}` : ""}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>Status: {detail.firstJob.status} — cannot go live until this employer is approved.</p>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Admin decision</h3>
          <div className="mt-4 space-y-3">
            <DetailItem label="Approval SLA" value={<SlaBadge sla={detail.sla} />} />
            {detail.verificationNote && <DetailItem label="Last note" value={detail.verificationNote} />}
          </div>

          <label className="mt-5 block">
            <span className="field-label">Note to employer</span>
            <textarea
              className="field-box min-h-28 resize-y"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Example: Domain verified, but registration document is missing."
            />
          </label>
          <p className="mt-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Sent to the employer exactly as written, whether you request more info or reject.
          </p>

          <div className="my-5 h-px" style={{ background: "var(--border-default)" }} />
          <Button
            className="w-full mb-2"
            style={{ background: "var(--gold-bg)", color: "#8A5D10", border: "1px solid #F0DFAE" }}
            disabled={busy || !note.trim()}
            onClick={() => run(() => adminApi.requestMoreInfo(id, note.trim()), "requestInfo")}
          >
            {busyAction === "requestInfo" ? <><Loader2 size={14} className="animate-spin shrink-0" />Sending…</> : "Request more info"}
          </Button>
          <Button className="w-full mb-2" disabled={busy} onClick={() => run(() => adminApi.approveVerification(id), "approve")}>
            {busyAction === "approve" ? <><Loader2 size={14} className="animate-spin shrink-0" />Approving…</> : "Approve employer"}
          </Button>
          <Button className="w-full" variant="danger" disabled={busy || !note.trim()} onClick={() => run(() => adminApi.rejectVerification(id, note.trim()), "reject")}>
            {busyAction === "reject" ? <><Loader2 size={14} className="animate-spin shrink-0" />Rejecting…</> : "Reject employer"}
          </Button>
          {!note.trim() && <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>Add a note above to request info or reject.</p>}
        </div>
      </div>
    </div>
  );
}
