import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Ban, CheckCircle2, Edit2, Eye, Loader2, PlusCircle, SlidersHorizontal, Trash2 } from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Select } from "../../components/common/Select.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const EMP = "var(--accent)";

const STATUS_LABELS = { ACTIVE: "Active", INACTIVE: "Inactive", DRAFT: "Draft", EXPIRED: "Expired", REJECTED: "Rejected" };
const STATUS_TONES = { ACTIVE: "green", INACTIVE: "amber", DRAFT: "neutral", EXPIRED: "red", REJECTED: "red" };
const CREDIT_LABELS = { FREE: "Free monthly job", PAID: "Paid credit" };

function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export function EmployerJobs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [jobs, setJobs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState(searchParams.get("search") ?? "");
  const [status, setStatus]   = useState("");
  const [verified, setVerified] = useState(true);
  const [busyId, setBusyId]   = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [toggleError, setToggleError] = useState("");

  async function load(p = page, q = search, st = status) {
    setLoading(true);
    try {
      const { data } = await employerApi.listJobs({ page: p, limit: 20, ...(q ? { search: q } : {}), ...(st ? { status: st } : {}) });
      setJobs(data.data.jobs);
      setTotal(data.data.pagination.total);
      setTotalPages(data.data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, searchParams.get("search") ?? "", "");
    employerApi.getProfile().then(({ data }) => setVerified(data.data.verificationStatus === "APPROVED")).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggle(job) {
    setBusyId(job.id);
    setBusyAction("toggle");
    setToggleError("");
    try {
      await employerApi.updateJobStatus(job.id, { status: job.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
      await load();
    } catch (error) {
      setToggleError(error.response?.data?.message ?? "Unable to update job status");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function handleDelete(job) {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    setBusyId(job.id);
    setBusyAction("delete");
    try {
      await employerApi.deleteJob(job.id);
      await load();
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function handleEdit(job) {
    // A live job is never edited in place — start (or resume) a revision and
    // edit that working copy instead, so candidates keep seeing the current
    // version until an admin approves the change.
    if (job.status !== "ACTIVE") {
      navigate(`/employer/jobs/${job.id}/edit`);
      return;
    }
    setBusyId(job.id);
    setBusyAction("edit");
    setToggleError("");
    try {
      const { data } = await employerApi.reviseJob(job.id);
      navigate(`/employer/jobs/${data.data.id}/edit`);
    } catch (error) {
      setToggleError(error.response?.data?.message ?? "Unable to start an update for this job");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    load(1, search, status);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>Jobs</h1>
          <p className="mt-1 text-base" style={{ color: "var(--text-secondary)" }}>{total} listing{total !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/employer/jobs/create" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: EMP }}>
          <PlusCircle size={16} />Post a job
        </Link>
      </div>

      {!verified && (
        <div className="mb-5 rounded-2xl p-4 text-sm" style={{ background: "var(--gold-bg)", color: "#8A5D10", border: "1px solid #F0DFAE" }}>
          Publishing is locked until company verification is complete. Draft creation is still allowed.
        </div>
      )}

      {toggleError && <Alert>{toggleError}</Alert>}

      <form onSubmit={handleFilterSubmit} className="mb-5 flex flex-wrap items-center gap-2">
        <input
          className="h-11 min-w-40 flex-1 rounded-full px-4 text-sm outline-none"
          style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
          placeholder="Search jobs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="h-11 w-44 shrink-0 [&>button]:h-11"
          pill
          icon={SlidersHorizontal}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[{ value: "", label: "All status" }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))]}
        />
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors hover:bg-[var(--bg-elev)]"
          style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)", color: "var(--text-primary)" }}
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading jobs" /></div>
      ) : !jobs.length ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <div>
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>No listings yet</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Post your first job to start receiving applications.</p>
            <Link to="/employer/jobs/create" className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: EMP }}>Post a job</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  {["Job", "Status", "Credit source", "Applicants", "Posted", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${h === "Actions" ? "text-right pr-5" : "text-left"}`}
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => (
                  <tr key={job.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none", background: "var(--bg-white)" }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.location}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                      {job.status === "REJECTED" && job.reviewNote && (
                        <p className="mt-1 max-w-[220px] text-xs" style={{ color: "var(--text-tertiary)" }} title={job.reviewNote}>
                          {job.reviewNote}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{CREDIT_LABELS[job.creditSource] ?? "Not consumed"}</td>
                    <td className="px-4 py-3">
                      <Link to={`/employer/jobs/${job.id}/applications`} className="font-semibold hover:underline" style={{ color: EMP }}>
                        {job._count.applications}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(job.createdAt)}</td>
                    <td className="py-3 pl-4 pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="secondary" className="w-[104px] justify-center" onClick={() => handleEdit(job)} disabled={!!busyId}>
                          {busyId === job.id && busyAction === "edit" ? <Loader2 size={13} className="animate-spin" /> : <Edit2 size={13} />}Edit
                        </Button>
                        {job.status === "REJECTED" ? (
                          <Button size="sm" variant="secondary" className="w-[104px] justify-center" disabled title="Rejected jobs can't be republished directly">
                            Rejected
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" className="w-[104px] justify-center" disabled={!!busyId} onClick={() => handleToggle(job)}>
                            {busyId === job.id && busyAction === "toggle" ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : job.status === "ACTIVE" ? (
                              <Ban size={13} />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            {job.status === "ACTIVE" ? "Unpublish" : "Publish"}
                          </Button>
                        )}
                        <Link to={`/employer/jobs/${job.id}/applications`}>
                          <Button size="sm" variant="secondary" className="w-[104px] justify-center" disabled={!!busyId}><Eye size={13} />View</Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="w-[104px] justify-center" disabled={!!busyId} onClick={() => handleDelete(job)} style={{ color: "var(--text-tertiary)" }}>
                          {busyId === job.id && busyAction === "delete" ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Trash2 size={13} />}Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); load(p); }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
