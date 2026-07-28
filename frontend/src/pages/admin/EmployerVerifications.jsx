import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const CHIPS = [
  { key: "all", label: "All pending" },
  { key: "breached", label: "Breached" },
  { key: "due-soon", label: "Due < 4h" },
  { key: "missing-doc", label: "Missing docs" },
  { key: "domain-issue", label: "Domain issue" },
];

function initialsOf(name) {
  return (name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function SlaBadge({ sla }) {
  if (sla.breached) return <Badge tone="red">Breached</Badge>;
  if (sla.hoursRemaining < 4) return <Badge tone="amber">{sla.hoursRemaining}h left</Badge>;
  return <Badge tone="green">{sla.hoursRemaining}h left</Badge>;
}

function SignalChips({ signals }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <Badge tone={signals.emailDomainMatches ? "green" : "neutral"}>{signals.emailDomainMatches ? "Domain verified" : "Domain unverified"}</Badge>
      <Badge tone={signals.hasDocument ? "green" : "red"}>{signals.hasDocument ? "Doc verified" : "Doc missing"}</Badge>
      <Badge tone={signals.hasLinkedIn ? "green" : "neutral"}>{signals.hasLinkedIn ? "LinkedIn added" : "No LinkedIn"}</Badge>
    </div>
  );
}

export function EmployerVerifications() {
  const [profiles, setProfiles] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [activeChip, setActiveChip] = useState("all");
  const [modal, setModal] = useState(null); // { type: 'request'|'reject', id }
  const [note, setNote] = useState("");

  async function load() {
    const { data } = await adminApi.pendingVerifications({ page: 1, limit: 50 });
    setProfiles(data.data.profiles);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!profiles) return null;
    switch (activeChip) {
      case "breached": return profiles.filter((p) => p.sla.breached);
      case "due-soon": return profiles.filter((p) => !p.sla.breached && p.sla.hoursRemaining < 4);
      case "missing-doc": return profiles.filter((p) => !p.signals.hasDocument);
      case "domain-issue": return profiles.filter((p) => !p.signals.emailDomainMatches);
      default: return profiles;
    }
  }, [profiles, activeChip]);

  async function approve(id) {
    setBusyId(id);
    setError("");
    try {
      await adminApi.approveVerification(id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to approve");
    } finally {
      setBusyId(null);
    }
  }

  function openModal(type, id) {
    setNote("");
    setModal({ type, id });
  }

  async function confirmModal() {
    if (!note.trim()) return;
    const { type, id } = modal;
    setBusyId(id);
    setError("");
    try {
      if (type === "reject") await adminApi.rejectVerification(id, note.trim());
      else await adminApi.requestMoreInfo(id, note.trim());
      setModal(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to complete action");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Employer approvals</h1>
      <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        Every employer must be verified before publishing jobs. Use request-more-info instead of rejecting genuine companies with missing documents.
      </p>

      {error && <Alert>{error}</Alert>}

      {!profiles ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading verifications" /></div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setActiveChip(chip.key)}
                className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
                style={{
                  background: activeChip === chip.key ? "var(--text-primary)" : "var(--bg-white)",
                  color: activeChip === chip.key ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {!filtered.length ? (
            <div className="card-soft grid min-h-56 place-items-center p-8 text-center">
              <div>
                <ShieldCheck className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
                <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>Nothing here</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>No employers match this filter.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
              {filtered.map((p, i) => (
                <div key={p.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: i ? "1px solid var(--border-default)" : "none" }}>
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-extrabold" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                      {initialsOf(p.companyName)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold" style={{ color: "var(--text-primary)" }}>{p.companyName}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{p.user.name} · {p.user.email} · submitted {formatDate(p.sla.submittedAt)}</p>
                      <SignalChips signals={p.signals} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <SlaBadge sla={p.sla} />
                    <Link to={`/admin/verifications/${p.id}`}><Button size="sm" variant="secondary">View details</Button></Link>
                    <Button size="sm" style={{ background: "var(--gold-bg)", color: "#8A5D10", border: "1px solid #F0DFAE" }} disabled={busyId === p.id} onClick={() => openModal("request", p.id)}>
                      Request info
                    </Button>
                    <Button size="sm" disabled={busyId === p.id} onClick={() => approve(p.id)}>
                      {busyId === p.id ? <><Loader2 size={13} className="animate-spin shrink-0" />Approving…</> : "Approve"}
                    </Button>
                    <Button size="sm" variant="danger" disabled={busyId === p.id} onClick={() => openModal("reject", p.id)}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!modal} title={modal?.type === "reject" ? "Reject employer" : "Request more information"} onClose={() => setModal(null)}>
        <label className="block">
          <span className="field-label">Note {modal?.type === "reject" ? "(shown to the employer)" : "(what's missing)"}</span>
          <textarea
            className="field-box min-h-28 resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={modal?.type === "reject" ? "Explain why this application was rejected…" : "e.g. Please upload your commercial registration document."}
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant={modal?.type === "reject" ? "danger" : "primary"} disabled={!note.trim() || busyId === modal?.id} onClick={confirmModal}>
            {busyId === modal?.id ? <><Loader2 size={14} className="animate-spin shrink-0" />Submitting…</> : "Confirm"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
