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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="page-title text-3xl md:text-4xl">Applications</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>Review candidates, track HR delivery, and update application outcomes.</p>
        </div>
        <Button className="w-full sm:w-auto" variant="secondary" onClick={exportCsv}><Download size={16} />Export CSV</Button>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <Input id="applicationSearch" placeholder="Candidate or job title" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className="field-box w-auto appearance-none" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option><option>APPLIED</option><option>UNDER_REVIEW</option><option>SELECTED</option><option>REJECTED</option>
        </select>
        <select className="field-box w-auto appearance-none" value={filters.hrEmailStatus} onChange={(event) => setFilters({ ...filters, hrEmailStatus: event.target.value })}>
          <option value="">All email statuses</option><option>PENDING</option><option>SENT</option><option>FAILED</option>
        </select>
      </div>
      {!applications ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading applications" /></div>
      ) : applications.length ? (
        <>
          <div className="card-soft hidden lg:block overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  {["Candidate", "Job", "Applied", "Status", "HR email", ""].map((h) => (
                    <th key={h} className="px-5 py-4 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((item) => (
                  <tr style={{ borderTop: "1px solid var(--border-default)" }} key={item.id}>
                    <td className="px-5 py-4"><strong className="block text-sm" style={{ color: "var(--text-primary)" }}>{item.user.name}</strong><span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{item.user.email}</span></td>
                    <td className="px-5 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{item.job.title}</td>
                    <td className="px-5 py-4 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(item.appliedAt)}</td>
                    <td className="px-5 py-4"><Badge tone={statusTone[item.status]}>{item.status.replaceAll("_", " ")}</Badge></td>
                    <td className="px-5 py-4"><Badge tone={emailTone[item.hrEmailStatus]}>{item.hrEmailStatus}</Badge></td>
                    <td className="px-5 py-4 text-right"><Link to={`/admin/applications/${item.id}`}><Button variant="secondary">View</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-4 lg:hidden">
            {applications.map((item) => (
              <article className="card-soft p-5" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.user.name}</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{item.user.email}</p>
                  </div>
                  <Badge tone={statusTone[item.status]}>{item.status.replaceAll("_", " ")}</Badge>
                </div>
                <dl className="mt-4 grid gap-2 text-sm">
                  <div><dt className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Job</dt><dd className="mt-0.5 font-medium" style={{ color: "var(--text-secondary)" }}>{item.job.title}</dd></div>
                  <div className="flex justify-between items-center"><span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(item.appliedAt)}</span><Badge tone={emailTone[item.hrEmailStatus]}>{item.hrEmailStatus}</Badge></div>
                </dl>
                <Link className="mt-4 block" to={`/admin/applications/${item.id}`}><Button className="w-full" variant="secondary">View application</Button></Link>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6 grid min-h-56 place-items-center rounded-2xl p-8 text-center" style={{ border: "1.5px dashed var(--border-strong)" }}>
          <div>
            <FileText className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>No applications found</h2>
          </div>
        </div>
      )}
    </div>
  );
}
