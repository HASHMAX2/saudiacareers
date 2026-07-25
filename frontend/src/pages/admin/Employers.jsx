import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Building2, Loader2, SlidersHorizontal } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Select } from "../../components/common/Select.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const STATUS_META = {
  APPROVED: { label: "Approved", tone: "green" },
  PENDING: { label: "Pending", tone: "amber" },
  REJECTED: { label: "Rejected", tone: "red" },
  SUSPENDED: { label: "Suspended", tone: "red" },
};

const PLAN_TONES = { FREE: "neutral", STARTER: "blue", GROWTH: "blue" };

export function Employers() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState("");
  const [planTier, setPlanTier] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reason, setReason] = useState("");

  async function load(p = page, q = search, st = status, plan = planTier) {
    try {
      const { data: res } = await adminApi.employers({
        page: p, limit: 20,
        ...(q ? { search: q } : {}),
        ...(st ? { status: st } : {}),
        ...(plan ? { planTier: plan } : {}),
      });
      setData(res.data);
      setLoadError("");
    } catch (requestError) {
      setLoadError(requestError.response?.data?.message ?? "Unable to load employers");
    }
  }

  useEffect(() => { load(1, search, status, planTier); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    load(1, search, status, planTier);
  }

  async function handleUnsuspend(employer) {
    setBusyId(employer.id);
    setError("");
    try {
      await adminApi.unsuspendEmployer(employer.id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to unsuspend");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmSuspend() {
    if (!reason.trim()) return;
    setBusyId(suspendTarget.id);
    setError("");
    try {
      await adminApi.suspendEmployer(suspendTarget.id, reason.trim());
      setSuspendTarget(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to suspend");
    } finally {
      setBusyId(null);
    }
  }

  const employers = data?.employers ?? null;

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Employers</h1>
      <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        All registered companies with approval status, billing plan, and account actions.
      </p>

      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleFilterSubmit} className="mb-5 flex flex-wrap items-center gap-2">
        <input
          className="h-11 min-w-40 flex-1 rounded-full px-4 text-sm outline-none"
          style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
          placeholder="Search employer or domain…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="h-11 w-44 shrink-0 [&>button]:h-11"
          pill
          icon={SlidersHorizontal}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "", label: "All statuses" },
            { value: "APPROVED", label: "Approved" },
            { value: "PENDING", label: "Pending" },
            { value: "REJECTED", label: "Rejected" },
            { value: "SUSPENDED", label: "Suspended" },
          ]}
        />
        <Select
          className="h-11 w-40 shrink-0 [&>button]:h-11"
          pill
          value={planTier}
          onChange={(e) => setPlanTier(e.target.value)}
          options={[
            { value: "", label: "All plans" },
            { value: "FREE", label: "Free" },
            { value: "STARTER", label: "Starter" },
            { value: "GROWTH", label: "Growth" },
          ]}
        />
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors hover:bg-[var(--bg-elev)]"
          style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)", color: "var(--text-primary)" }}
        >
          Search
        </button>
      </form>

      {loadError && employers && <Alert>{loadError}</Alert>}

      {!employers ? (
        loadError ? (
          <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{loadError}</p>
            <Button className="mt-4" variant="secondary" onClick={() => load()}>Retry</Button>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center"><Spinner label="Loading employers" /></div>
        )
      ) : !employers.length ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <Building2 className="mx-auto" size={28} style={{ color: "var(--text-tertiary)" }} />
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No employers found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  {["Employer", "Status", "Plan", "Jobs", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employers.map((e, i) => {
                  const statusKey = e.isSuspended ? "SUSPENDED" : e.verificationStatus;
                  const meta = STATUS_META[statusKey] ?? STATUS_META.PENDING;
                  return (
                    <tr key={e.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none", background: "var(--bg-white)" }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{e.companyName}</p>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{e.user?.email}{e.location ? ` · ${e.location}` : ""}</p>
                      </td>
                      <td className="px-4 py-3"><Badge tone={meta.tone}>{meta.label}</Badge></td>
                      <td className="px-4 py-3"><Badge tone={PLAN_TONES[e.subscription?.planTier] ?? "neutral"}>{e.subscription?.planTier ?? "FREE"}</Badge></td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{e.jobCount}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(e.user?.createdAt ?? e.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Link to={`/admin/verifications/${e.id}`}><Button size="sm" variant="secondary">View</Button></Link>
                          {e.isSuspended ? (
                            <Button size="sm" disabled={busyId === e.id} onClick={() => handleUnsuspend(e)}>
                              {busyId === e.id ? <Loader2 size={13} className="animate-spin" /> : null}Unsuspend
                            </Button>
                          ) : (
                            <Button size="sm" variant="danger" disabled={busyId === e.id} onClick={() => { setReason(""); setSuspendTarget(e); }}>
                              Suspend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={(p) => { setPage(p); load(p); }} />
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!suspendTarget} title={`Suspend ${suspendTarget?.companyName ?? ""}?`} onClose={() => setSuspendTarget(null)}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Suspended employers can still log in and view their dashboard, but cannot post or publish jobs until reinstated. This reason will be shown to the employer.
        </p>
        <label className="mt-3 block">
          <span className="field-label">Reason</span>
          <textarea className="field-box min-h-24 resize-y" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Repeated policy violations" />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setSuspendTarget(null)}>Cancel</Button>
          <Button variant="danger" disabled={!reason.trim() || busyId === suspendTarget?.id} onClick={confirmSuspend}>Confirm suspend</Button>
        </div>
      </Modal>
    </div>
  );
}
