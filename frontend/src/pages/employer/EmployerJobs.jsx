import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit2, Eye, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

function StatusBadge({ status }) {
  return <Badge tone={status === "ACTIVE" ? "green" : "amber"}>{status === "ACTIVE" ? "Active" : "Inactive"}</Badge>;
}

export function EmployerJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [busyId, setBusyId]   = useState(null);

  async function load(p = page, q = search) {
    setLoading(true);
    try {
      const { data } = await employerApi.listJobs({ page: p, limit: 20, ...(q ? { search: q } : {}) });
      setJobs(data.data.jobs);
      setTotal(data.data.pagination.total);
      setTotalPages(data.data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggle(job) {
    setBusyId(job.id);
    try {
      await employerApi.updateJobStatus(job.id, { status: job.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(job) {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    setBusyId(job.id);
    try {
      await employerApi.deleteJob(job.id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    load(1, search);
  }

  return (
    <div>
      <p className="section-label">Employer</p>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl md:text-4xl">My job listings</h1>
          <p className="mt-1 text-base" style={{ color: "var(--text-secondary)" }}>{total} listing{total !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/employer/jobs/create" className="btn-primary inline-flex items-center gap-2">
          <PlusCircle size={16} />Post a job
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-5 flex gap-2">
        <input
          className="form-control flex-1"
          placeholder="Search by title or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {loading ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading jobs" /></div>
      ) : !jobs.length ? (
        <div className="card-soft grid min-h-56 place-items-center p-8 text-center">
          <div>
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>No listings yet</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Post your first job to start receiving applications.</p>
            <Link to="/employer/jobs/create" className="btn-primary mt-5 inline-flex">Post a job</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  {["Job title", "Status", "Applications", "Posted", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => (
                  <tr key={job.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none", background: "var(--bg-white)" }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.companyName}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3">
                      <Link to={`/employer/jobs/${job.id}/applications`} className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                        {job._count.applications}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(job.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => navigate(`/employer/jobs/${job.id}/edit`)} disabled={!!busyId}>
                          <Edit2 size={13} />Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!!busyId}
                          onClick={() => handleToggle(job)}
                        >
                          {busyId === job.id ? <Loader2 size={13} className="animate-spin" /> : null}
                          {job.status === "ACTIVE" ? "Unpublish" : "Publish"}
                        </Button>
                        <Button size="sm" variant="ghost" disabled={!!busyId} onClick={() => handleDelete(job)} style={{ color: "var(--text-tertiary)" }}>
                          <Trash2 size={13} />
                        </Button>
                        <Link to={`/employer/jobs/${job.id}/applications`}>
                          <Button size="sm" variant="secondary" disabled={!!busyId}><Eye size={13} />View</Button>
                        </Link>
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
