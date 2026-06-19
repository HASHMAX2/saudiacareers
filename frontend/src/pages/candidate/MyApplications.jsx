import { useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";
import { applicationsApi } from "../../api/applications.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const tones = { APPLIED: "blue", UNDER_REVIEW: "amber", SELECTED: "green", REJECTED: "red" };

export function MyApplications() {
  const [applications, setApplications] = useState(null);
  useEffect(() => { applicationsApi.mine().then(({ data }) => setApplications(data.data)); }, []);
  if (!applications) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading applications" /></div>;
  return (
    <div>
      <h1 className="page-heading">My applications</h1>
      <p className="page-subheading">Track the latest status of every role you have applied for.</p>
      <div className="mt-7 space-y-4">
        {applications.map((application) => (
          <article className="rounded-2xl border border-slate-200 p-5 transition hover:border-brand-200 sm:p-6" key={application.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{application.job.title}</h2>
                <p className="mt-1 font-medium text-slate-600">{application.job.companyName}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                  <span className="flex items-center gap-2"><MapPin size={15} />{application.job.location}</span>
                  <span className="flex items-center gap-2"><CalendarDays size={15} />Applied {formatDate(application.appliedAt)}</span>
                </div>
              </div>
              <Badge tone={tones[application.status]}>{application.status.replaceAll("_", " ")}</Badge>
            </div>
          </article>
        ))}
      </div>
      {!applications.length && <div className="mt-7 grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-300 text-center"><div><BriefcaseBusiness className="mx-auto text-slate-400" size={30} /><h2 className="mt-3 font-bold">No applications yet</h2><p className="mt-1 text-sm text-slate-500">Your submitted applications will appear here.</p></div></div>}
    </div>
  );
}
