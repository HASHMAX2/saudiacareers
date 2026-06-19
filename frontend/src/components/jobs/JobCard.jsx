import { Banknote, BriefcaseBusiness, CalendarDays, Clock3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../common/Badge.jsx";
import { Button } from "../common/Button.jsx";
import { formatDate } from "../../utils/formatDate.js";

export function JobCard({ job }) {
  return (
    <article className="surface-card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link className="line-clamp-2 text-lg font-bold text-slate-900 transition group-hover:text-brand-700 sm:text-xl" to={`/jobs/${job.id}`}>
            {job.title}
          </Link>
          <p className="mt-1 font-medium text-slate-600">{job.companyName}</p>
        </div>
        {job.isClosed ? <Badge tone="red">Closed</Badge> : <Badge tone="green">Open</Badge>}
      </div>
      <div className="mt-5 grid gap-2.5 text-sm text-slate-600 sm:grid-cols-2">
        <span className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" />{job.location}</span>
        <span className="flex items-center gap-2"><BriefcaseBusiness size={16} className="text-slate-400" />{job.employmentType}</span>
        <span className="flex items-center gap-2"><Clock3 size={16} className="text-slate-400" />{job.experienceRequired}</span>
        {job.salaryRange && <span className="flex items-center gap-2"><Banknote size={16} className="text-slate-400" />{job.salaryRange}</span>}
      </div>
      <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-xs font-medium text-slate-500"><CalendarDays size={14} />Posted {formatDate(job.createdAt)}</span>
        <Link to={`/jobs/${job.id}`}><Button className="w-full sm:w-auto" variant={job.isClosed ? "secondary" : "primary"}>{job.isClosed ? "View details" : "View job"}</Button></Link>
      </div>
    </article>
  );
}
