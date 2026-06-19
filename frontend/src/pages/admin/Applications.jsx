import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const statusTone = { APPLIED: "blue", UNDER_REVIEW: "amber", SELECTED: "green", REJECTED: "red" };
const emailTone = { PENDING: "amber", SENT: "green", FAILED: "red" };

export function Applications() {
  const [applications, setApplications] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "", hrEmailStatus: "" });
  useEffect(() => { adminApi.applications(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).then(({ data }) => setApplications(data.data.applications)); }, [filters]);
  async function exportCsv() {
    const response = await adminApi.exportApplications(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)));
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a"); link.href = url; link.download = "applications.csv"; link.click(); URL.revokeObjectURL(url);
  }
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="page-heading">Applications</h1><p className="page-subheading">Review candidates, track HR delivery, and update application outcomes.</p></div><Button className="w-full sm:w-auto" variant="secondary" onClick={exportCsv}><Download size={17} />Export CSV</Button></div>
      <div className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3"><Input id="applicationSearch" placeholder="Candidate or job title" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /><select className="form-control" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All application statuses</option><option>APPLIED</option><option>UNDER_REVIEW</option><option>SELECTED</option><option>REJECTED</option></select><select className="form-control" value={filters.hrEmailStatus} onChange={(event) => setFilters({ ...filters, hrEmailStatus: event.target.value })}><option value="">All email statuses</option><option>PENDING</option><option>SENT</option><option>FAILED</option></select></div>
      {!applications ? <div className="grid min-h-64 place-items-center"><Spinner label="Loading applications" /></div> : applications.length ? <>
        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 lg:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Candidate</th><th className="px-5 py-4">Job</th><th className="px-5 py-4">Applied</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">HR email</th><th className="px-5 py-4" /></tr></thead><tbody className="divide-y divide-slate-100">{applications.map((item) => <tr className="hover:bg-slate-50/70" key={item.id}><td className="px-5 py-4"><strong className="block">{item.user.name}</strong><span className="text-slate-500">{item.user.email}</span></td><td className="px-5 py-4">{item.job.title}</td><td className="px-5 py-4 text-slate-600">{formatDate(item.appliedAt)}</td><td className="px-5 py-4"><Badge tone={statusTone[item.status]}>{item.status.replaceAll("_", " ")}</Badge></td><td className="px-5 py-4"><Badge tone={emailTone[item.hrEmailStatus]}>{item.hrEmailStatus}</Badge></td><td className="px-5 py-4 text-right"><Link to={`/admin/applications/${item.id}`}><Button variant="secondary">View</Button></Link></td></tr>)}</tbody></table></div>
        <div className="mt-5 space-y-4 lg:hidden">{applications.map((item) => <article className="rounded-2xl border border-slate-200 p-5" key={item.id}><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{item.user.name}</h2><p className="text-sm text-slate-500">{item.user.email}</p></div><Badge tone={statusTone[item.status]}>{item.status.replaceAll("_", " ")}</Badge></div><dl className="mt-4 grid gap-2 text-sm"><div><dt className="text-slate-500">Job</dt><dd className="font-medium">{item.job.title}</dd></div><div className="flex justify-between"><span className="text-slate-500">{formatDate(item.appliedAt)}</span><Badge tone={emailTone[item.hrEmailStatus]}>{item.hrEmailStatus}</Badge></div></dl><Link className="mt-4 block" to={`/admin/applications/${item.id}`}><Button className="w-full" variant="secondary">View application</Button></Link></article>)}</div>
      </> : <div className="mt-6 grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-300 text-center"><div><FileText className="mx-auto text-slate-400" size={30} /><h2 className="mt-3 font-bold">No applications found</h2></div></div>}
    </div>
  );
}
