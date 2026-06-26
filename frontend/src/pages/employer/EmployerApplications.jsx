import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const STATUS_OPTIONS = ["APPLIED", "SHORTLISTED", "ON_HOLD", "REJECTED"];

const STATUS_META = {
  APPLIED:     { label: "Applied",     tone: "blue"  },
  SHORTLISTED: { label: "Shortlisted", tone: "green" },
  ON_HOLD:     { label: "On hold",     tone: "amber" },
  UNDER_REVIEW:{ label: "Under review",tone: "amber" },
  SELECTED:    { label: "Selected",    tone: "green" },
  REJECTED:    { label: "Rejected",    tone: "red"   },
};

function AppBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "blue" };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function EmployerApplications() {
  const { id: jobId } = useParams();
  const [job, setJob]               = useState(null);
  const [applications, setApps]     = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [busyId, setBusyId]         = useState(null);
  const [downloadingId, setDlId]    = useState(null);

  async function load(p = page, q = search, st = statusFilter) {
    setLoading(true);
    try {
      const { data } = await employerApi.getJobApplications(jobId, {
        page: p, limit: 20,
        ...(q  ? { search: q } : {}),
        ...(st ? { status: st } : {}),
      });
      setJob(data.data.job);
      setApps(data.data.applications);
      setTotal(data.data.pagination.total);
      setTotalPages(data.data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatus(appId, status) {
    setBusyId(appId);
    try {
      await employerApi.updateAppStatus(appId, { status });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDownload(app) {
    if (!app.user.profile?.resumePath) return;
    setDlId(app.id);
    try {
      const { data } = await employerApi.getApplication(app.id);
      if (data.data.resumeUrl) window.open(data.data.resumeUrl, "_blank");
    } finally {
      setDlId(null);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    load(1, search, statusFilter);
  }

  return (
    <div>
      <Link to="/employer/jobs" className="inline-flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft size={14} />Back to listings
      </Link>
      <p className="section-label">Employer</p>
      <h1 className="page-title text-3xl md:text-4xl">{job?.title ?? "Applications"}</h1>
      <p className="mt-1 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        {total} applicant{total !== 1 ? "s" : ""}
      </p>

      {/* Filters */}
      <form onSubmit={handleSearch} className="mb-5 flex flex-wrap gap-2">
        <input
          className="form-control flex-1 min-w-40"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-control appearance-none w-44"
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1); load(1, search, e.target.value); }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_META[s]?.label ?? s}</option>)}
        </select>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {loading ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading applications" /></div>
      ) : !applications.length ? (
        <div className="card-soft grid min-h-56 place-items-center p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No applications yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="card-soft p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{app.user.name}</p>
                      <AppBadge status={app.status} />
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{app.user.email}</p>
                    {app.user.mobile && <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{app.user.mobile}</p>}
                    {app.user.profile?.designation && (
                      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{app.user.profile.designation}</p>
                    )}
                    {app.user.profile?.experience && (
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{app.user.profile.experience} experience</p>
                    )}
                    <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>Applied {formatDate(app.appliedAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {app.user.profile?.resumePath && (
                      <Button size="sm" variant="secondary" disabled={!!busyId || downloadingId === app.id} onClick={() => handleDownload(app)}>
                        {downloadingId === app.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                        Resume
                      </Button>
                    )}
                    {STATUS_OPTIONS.filter((s) => s !== app.status).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === "REJECTED" ? "ghost" : "secondary"}
                        disabled={!!busyId}
                        onClick={() => handleStatus(app.id, s)}
                        style={s === "REJECTED" ? { color: "var(--text-tertiary)" } : {}}
                      >
                        {busyId === app.id ? <Loader2 size={13} className="animate-spin" /> : null}
                        {STATUS_META[s]?.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
