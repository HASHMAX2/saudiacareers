import { useCallback, useEffect, useState } from "react";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="page-heading">Manage jobs</h1><p className="page-subheading">Create, update, activate, or soft-delete job listings.</p></div>
        <Link to="/admin/jobs/create"><Button className="w-full sm:w-auto"><Plus size={17} />Create job</Button></Link>
      </div>
      <div className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        <Input id="jobSearch" placeholder="Search title or company" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className="form-control" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option></select>
      </div>
      {!jobs ? <div className="grid min-h-64 place-items-center"><Spinner label="Loading jobs" /></div> : jobs.length ? <>
        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Job</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Applications</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{jobs.map((job) => <tr className="hover:bg-slate-50/70" key={job.id}><td className="px-5 py-4"><strong className="block text-slate-900">{job.title}</strong><span className="text-slate-500">{job.companyName}</span></td><td className="px-5 py-4"><Badge tone={job.status === "ACTIVE" ? "green" : "neutral"}>{job.status}</Badge></td><td className="px-5 py-4 font-semibold">{job._count.applications}</td><td className="px-5 py-4"><Actions job={job} load={load} /></td></tr>)}</tbody></table></div>
        <div className="mt-5 space-y-4 md:hidden">{jobs.map((job) => <article className="rounded-2xl border border-slate-200 p-5" key={job.id}><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{job.title}</h2><p className="mt-1 text-sm text-slate-500">{job.companyName}</p></div><Badge tone={job.status === "ACTIVE" ? "green" : "neutral"}>{job.status}</Badge></div><p className="mt-4 text-sm text-slate-600">{job._count.applications} applications</p><div className="mt-4"><Actions job={job} load={load} /></div></article>)}</div>
      </> : <div className="mt-6 grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-300 text-center"><div><BriefcaseBusiness className="mx-auto text-slate-400" size={30} /><h2 className="mt-3 font-bold">No jobs found</h2></div></div>}
    </div>
  );
}

function Actions({ job, load }) {
  return <div className="flex flex-wrap justify-end gap-2"><Link to={`/admin/jobs/${job.id}/edit`}><Button variant="secondary">Edit</Button></Link><Button variant="secondary" onClick={async () => { await adminApi.updateJobStatus(job.id, job.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"); load(); }}>{job.status === "ACTIVE" ? "Deactivate" : "Activate"}</Button><Button variant="danger" onClick={async () => { if (window.confirm("Delete this job?")) { await adminApi.deleteJob(job.id); load(); } }}>Delete</Button></div>;
}
