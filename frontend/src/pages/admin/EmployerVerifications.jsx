import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

export function EmployerVerifications() {
  const [profiles, setProfiles] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await adminApi.pendingVerifications({ page: 1, limit: 50 });
    setProfiles(data.data.profiles);
  }

  useEffect(() => { load(); }, []);

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

  async function reject(id) {
    const note = window.prompt("Reason for rejection (shown to the employer):");
    if (!note) return;
    setBusyId(id);
    setError("");
    try {
      await adminApi.rejectVerification(id, note);
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
      <h1 className="page-title text-3xl md:text-4xl">Employer verifications</h1>
      <p className="mt-2 mb-7 text-base" style={{ color: "var(--text-secondary)" }}>
        Review submitted company documents. Approving unlocks job publishing for that employer.
      </p>

      {error && <Alert>{error}</Alert>}

      {!profiles ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading verifications" /></div>
      ) : !profiles.length ? (
        <div className="card-soft grid min-h-56 place-items-center p-8 text-center">
          <div>
            <ShieldCheck className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>Nothing pending</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>No employer documents are waiting for review.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((p) => (
            <div key={p.id} className="card-soft flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.companyName}</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{p.user.name} · {p.user.email}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>Submitted {formatDate(p.updatedAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {p.documentUrl && (
                  <a href={p.documentUrl} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm">View document</Button>
                  </a>
                )}
                <Button size="sm" disabled={busyId === p.id} onClick={() => approve(p.id)}>Approve</Button>
                <Button size="sm" variant="danger" disabled={busyId === p.id} onClick={() => reject(p.id)}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
