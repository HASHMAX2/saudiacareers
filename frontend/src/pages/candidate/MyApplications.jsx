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
      <p className="section-label">Candidate</p>
      <h1 className="page-title text-3xl md:text-4xl">My applications</h1>
      <p className="mt-2 mb-7 text-base" style={{ color: "var(--text-secondary)" }}>Track the latest status of every role you have applied for.</p>
      <div className="space-y-4">
        {applications.map((application) => (
          <article className="card-soft p-5 sm:p-6" key={application.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif", color: "var(--text-primary)" }}>{application.job.title}</h2>
                <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{application.job.companyName}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <span className="flex items-center gap-2"><MapPin size={13} />{application.job.location}</span>
                  <span className="flex items-center gap-2"><CalendarDays size={13} />Applied {formatDate(application.appliedAt)}</span>
                </div>
              </div>
              <Badge tone={tones[application.status]}>{application.status.replaceAll("_", " ")}</Badge>
            </div>
          </article>
        ))}
      </div>
      {!applications.length && (
        <div className="mt-7 grid min-h-56 place-items-center rounded-2xl p-8 text-center" style={{ border: "1.5px dashed var(--border-strong)" }}>
          <div>
            <BriefcaseBusiness className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>No applications yet</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Your submitted applications will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
