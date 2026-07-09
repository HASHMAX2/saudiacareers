import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, SlidersHorizontal } from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Select } from "../../components/common/Select.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const EMP = "var(--accent)";
const EMP_SUBTLE = "var(--accent-subtle)";

const STATUS_OPTIONS = ["APPLIED", "SHORTLISTED", "ON_HOLD", "REJECTED"];

const STATUS_META = {
  APPLIED:      { label: "New",         tone: "blue"  },
  SHORTLISTED:  { label: "Shortlisted", tone: "green" },
  ON_HOLD:      { label: "On hold",     tone: "amber" },
  UNDER_REVIEW: { label: "Under review",tone: "amber" },
  SELECTED:     { label: "Selected",    tone: "green" },
  REJECTED:     { label: "Rejected",    tone: "red"   },
};

function initialsOf(name) {
  return (name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
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

  const initialLoading = loading && !job;

  return (
    <div>
      <Link to="/employer/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft size={14} />Back to listings
      </Link>
      {initialLoading ? (
        <>
          <div className="h-9 w-72 max-w-full animate-pulse rounded-lg" style={{ background: "rgba(0,0,0,0.08)" }} />
          <div className="mt-2 mb-6 h-4 w-24 animate-pulse rounded" style={{ background: "rgba(0,0,0,0.08)" }} />
        </>
      ) : (
        <>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>{job?.title ?? "Job not found"}</h1>
          <p className="mt-1 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
            {total} applicant{total !== 1 ? "s" : ""}
          </p>
        </>
      )}

      {!initialLoading && (
        <form onSubmit={handleSearch} className="mb-5 flex flex-wrap gap-2">
          <input
            className="min-w-40 flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
            style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
            placeholder="Search candidate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            className="w-44"
            pill
            icon={SlidersHorizontal}
            value={statusFilter}
            onChange={(e) => { setStatus(e.target.value); setPage(1); load(1, search, e.target.value); }}
            options={[{ value: "", label: "All stages" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_META[s]?.label ?? s }))]}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      )}

      {initialLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl" style={{ background: "var(--bg-elev)" }} />
                <div className="flex-1">
                  <div className="h-4 w-32 animate-pulse rounded" style={{ background: "var(--bg-elev)" }} />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded" style={{ background: "var(--bg-elev)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : loading ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading applications" /></div>
      ) : !applications.length ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No applications yet.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {applications.map((app) => {
              const skills = (app.user.profile?.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
              return (
                <div key={app.id} className="rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-extrabold" style={{ background: EMP_SUBTLE, color: EMP }}>
                        {initialsOf(app.user.name)}
                      </span>
                      <div>
                        <h4 className="font-bold" style={{ color: "var(--text-primary)" }}>{app.user.name}</h4>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {[app.user.profile?.designation, app.user.profile?.experience, app.user.profile?.location].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <Badge tone={STATUS_META[app.status]?.tone ?? "blue"}>{STATUS_META[app.status]?.label ?? app.status}</Badge>
                  </div>

                  {skills.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <span key={skill} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--bg-elev)", color: "var(--text-secondary)" }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Applied {formatDate(app.appliedAt)}{app.user.email ? ` · ${app.user.email}` : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
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
                        variant={s === "REJECTED" ? "ghost" : "primary"}
                        disabled={!!busyId}
                        onClick={() => handleStatus(app.id, s)}
                        style={s === "REJECTED" ? { color: "var(--text-tertiary)" } : { background: EMP, borderColor: EMP }}
                      >
                        {busyId === app.id ? <Loader2 size={13} className="animate-spin" /> : null}
                        {STATUS_META[s]?.label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
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
