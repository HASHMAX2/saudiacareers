import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, Loader2, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";

const PAGE_LIMIT = 30;

export function ManageJobs() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const anyBusy = deletingIds.size > 0 || bulkDeleting;

  const load = useCallback(async () => {
    const { data: res } = await adminApi.jobs({
      search: filters.search || undefined,
      status: filters.status || undefined,
      page,
      limit: PAGE_LIMIT,
    });
    setData(res.data);
  }, [filters.search, filters.status, page]);

  useEffect(() => { load(); }, [load]);

  function updateFilter(key, value) {
    setPage(1);
    setSelectedIds(new Set());
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const jobs = data?.jobs ?? null;
  const pagination = data?.pagination;
  const pageIds = jobs?.map((j) => j.id) ?? [];
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  function toggleSelectAll() {
    setSelectedIds(allPageSelected ? new Set() : new Set(pageIds));
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function markBusy(id) {
    setDeletingIds((prev) => new Set([...prev, id]));
  }

  function markDone(id) {
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (!window.confirm(`Delete ${ids.length} selected job${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(ids.map((id) => adminApi.deleteJob(id)));
      setSelectedIds(new Set());
      await load();
    } finally {
      setBulkDeleting(false);
    }
  }

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

      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          id="jobSearch"
          placeholder="Search title or company"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
        <select
          className="field-box w-auto appearance-none"
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            {selectedIds.size} job{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <Button size="sm" variant="danger" disabled={anyBusy} onClick={handleBulkDelete}>
            {bulkDeleting
              ? <><Loader2 size={13} className="animate-spin" />Deleting…</>
              : <><Trash2 size={13} />Delete selected</>}
          </Button>
        </div>
      )}

      {!jobs ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading jobs" /></div>
      ) : jobs.length ? (
        <>
          {pagination && (
            <p className="mb-3 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
              Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, pagination.total)} of {pagination.total} jobs
            </p>
          )}

          {/* Desktop table */}
          <div className="card-soft hidden md:block overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded"
                      checked={allPageSelected}
                      disabled={anyBusy}
                      onChange={toggleSelectAll}
                      aria-label="Select all on this page"
                    />
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Job</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Status</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Apps</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-right" style={{ color: "var(--text-tertiary)" }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: "1px solid var(--border-default)" }}>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    style={{
                      borderBottom: "1px solid var(--border-default)",
                      background: selectedIds.has(job.id) ? "var(--accent-subtle)" : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded"
                        checked={selectedIds.has(job.id)}
                        disabled={anyBusy}
                        onChange={() => toggleSelect(job.id)}
                        aria-label={`Select ${job.title}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <strong className="block text-sm" style={{ color: "var(--text-primary)" }}>{job.title}</strong>
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.companyName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={job.status === "ACTIVE" ? "green" : "neutral"}>{job.status}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
                      {job._count.applications}
                    </td>
                    <td className="px-4 py-3">
                      <Actions job={job} load={load} anyBusy={anyBusy} markBusy={markBusy} markDone={markDone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 space-y-3 md:hidden">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="card-soft p-4"
                style={{ background: selectedIds.has(job.id) ? "var(--accent-subtle)" : undefined }}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 cursor-pointer rounded shrink-0"
                    checked={selectedIds.has(job.id)}
                    disabled={anyBusy}
                    onChange={() => toggleSelect(job.id)}
                    aria-label={`Select ${job.title}`}
                  />
                  <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <h2 className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{job.title}</h2>
                      <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>{job.companyName}</p>
                      <p className="mt-2 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{job._count.applications} applications</p>
                    </div>
                    <Badge tone={job.status === "ACTIVE" ? "green" : "neutral"}>{job.status}</Badge>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Actions job={job} load={load} anyBusy={anyBusy} markBusy={markBusy} markDone={markDone} />
                </div>
              </article>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
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

function Actions({ job, load, anyBusy, markBusy, markDone }) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    markBusy(job.id);
    try {
      await adminApi.updateJobStatus(job.id, job.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      await load();
    } finally {
      setToggling(false);
      markDone(job.id);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this job? This cannot be undone.")) return;
    setDeleting(true);
    markBusy(job.id);
    try {
      await adminApi.deleteJob(job.id);
      await load();
    } finally {
      setDeleting(false);
      markDone(job.id);
    }
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button size="sm" variant="secondary" disabled={anyBusy} onClick={() => navigate(`/admin/jobs/${job.id}/edit`)}>
        Edit
      </Button>
      <Button size="sm" variant="secondary" className="min-w-[108px]" disabled={anyBusy} onClick={handleToggle}>
        {toggling
          ? <><Loader2 size={12} className="animate-spin" />{job.status === "ACTIVE" ? "Deactivating…" : "Activating…"}</>
          : job.status === "ACTIVE" ? "Deactivate" : "Activate"}
      </Button>
      <Button size="sm" variant="danger" disabled={anyBusy} onClick={handleDelete}>
        {deleting ? <><Loader2 size={12} className="animate-spin" />Deleting…</> : "Delete"}
      </Button>
    </div>
  );
}
