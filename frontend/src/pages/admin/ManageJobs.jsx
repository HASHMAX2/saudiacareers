import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";

export function ManageJobs() {
  const [jobs, setJobs] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const load = useCallback(() => adminApi.jobs({ search: filters.search || undefined, status: filters.status || undefined }).then(({ data }) => setJobs(data.data.jobs)), [filters.search, filters.status]);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="page-title text-3xl md:text-4xl">Manage jobs</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>Create, update, activate, or soft-delete job listings.</p>
        </div>
        <Link to="/admin/jobs/create"><Button className="w-full sm:w-auto"><Plus size={16} />Create job</Button></Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <Input id="jobSearch" placeholder="Search title or company" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className="field-box w-auto appearance-none" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option>
        </select>
      </div>
      {!jobs ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading jobs" /></div>
      ) : jobs.length ? (
        <>
          <div className="card-soft mt-2 hidden md:block overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  <th className="px-5 py-4 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Job</th>
                  <th className="px-5 py-4 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Status</th>
                  <th className="px-5 py-4 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Applications</th>
                  <th className="px-5 py-4 font-mono text-xs uppercase tracking-wide text-right" style={{ color: "var(--text-tertiary)" }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: "1px solid var(--border-default)" }}>
                {jobs.map((job) => (
                  <tr className="transition-colors" style={{ borderBottom: "1px solid var(--border-default)" }} key={job.id}>
                    <td className="px-5 py-4">
                      <strong className="block text-sm" style={{ color: "var(--text-primary)" }}>{job.title}</strong>
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.companyName}</span>
                    </td>
                    <td className="px-5 py-4"><Badge tone={job.status === "ACTIVE" ? "green" : "neutral"}>{job.status}</Badge></td>
                    <td className="px-5 py-4 font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>{job._count.applications}</td>
                    <td className="px-5 py-4"><Actions job={job} load={load} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-4 md:hidden">
            {jobs.map((job) => (
              <article className="card-soft p-5" key={job.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{job.companyName}</p>
                  </div>
                  <Badge tone={job.status === "ACTIVE" ? "green" : "neutral"}>{job.status}</Badge>
                </div>
                <p className="mt-4 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{job._count.applications} applications</p>
                <div className="mt-4"><Actions job={job} load={load} /></div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6 grid min-h-56 place-items-center rounded-2xl p-8 text-center" style={{ border: "1.5px dashed var(--border-strong)" }}>
          <div>
            <BriefcaseBusiness className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>No jobs found</h2>
          </div>
        </div>
      )}
    </div>
  );
}

function Actions({ job, load }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await adminApi.updateJobStatus(job.id, job.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      load();
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this job? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await adminApi.deleteJob(job.id);
      load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Link to={`/admin/jobs/${job.id}/edit`}><Button variant="secondary">Edit</Button></Link>
      <Button variant="secondary" disabled={toggling || deleting} onClick={handleToggle}>
        {toggling ? <><Loader2 size={14} className="animate-spin" />{job.status === "ACTIVE" ? "Deactivating…" : "Activating…"}</> : (job.status === "ACTIVE" ? "Deactivate" : "Activate")}
      </Button>
      <Button variant="danger" disabled={deleting || toggling} onClick={handleDelete}>
        {deleting ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : "Delete"}
      </Button>
    </div>
  );
}
