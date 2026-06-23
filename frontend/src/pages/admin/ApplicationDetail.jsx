import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { useParams } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const statusTone = { APPLIED: "blue", UNDER_REVIEW: "amber", SELECTED: "green", REJECTED: "red" };

export function ApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const load = useCallback(() => adminApi.application(id).then(({ data }) => setApplication(data.data)), [id]);
  useEffect(() => { load(); }, [load]);
  if (!application) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading application" /></div>;
  const profile = application.user.profile;
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <p className="section-label">Application #{application.id}</p>
          <h1 className="page-title text-3xl md:text-4xl">{application.user.name}</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>Applied for {application.job.title} on {formatDate(application.appliedAt)}</p>
        </div>
        <Badge tone={statusTone[application.status]}>{application.status.replaceAll("_", " ")}</Badge>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <section className="card-soft p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold" style={{ color: "var(--text-primary)" }}>
              <UserRound size={17} style={{ color: "var(--accent)" }} />Candidate information
            </h2>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <Info icon={Mail} label="Email" value={application.user.email} />
              <Info icon={Phone} label="Mobile" value={application.user.mobile} />
              <Info icon={MapPin} label="Location" value={profile?.location || "Not provided"} />
              <Info icon={FileText} label="Experience" value={profile?.experience || "Not provided"} />
            </div>
          </section>
          <section className="card-soft p-5 sm:p-6">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Professional profile</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Designation</dt><dd className="mt-1" style={{ color: "var(--text-secondary)" }}>{profile?.designation || "Not provided"}</dd></div>
              <div><dt className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Skills</dt><dd className="mt-1" style={{ color: "var(--text-secondary)" }}>{profile?.skills || "Not provided"}</dd></div>
              <div><dt className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Professional summary</dt><dd className="mt-1 leading-6" style={{ color: "var(--text-secondary)" }}>{profile?.summary || "Not provided"}</dd></div>
            </dl>
          </section>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="card-soft p-5">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Application status</h2>
            <select className="field-box mt-4 w-full appearance-none" value={application.status} onChange={async (event) => { await adminApi.updateApplicationStatus(id, event.target.value); load(); }}>
              <option>APPLIED</option><option>UNDER_REVIEW</option><option>SELECTED</option><option>REJECTED</option>
            </select>
            <p className="mt-3 font-mono text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>Changing status sends an email notification to the candidate.</p>
          </section>
          <section className="card-soft p-5">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Resume</h2>
            {application.resumeUrl
              ? <Button className="mt-4 w-full" onClick={() => window.open(application.resumeUrl, "_blank")}><Download size={15} />Download resume</Button>
              : <p className="mt-3 text-sm" style={{ color: "var(--text-tertiary)" }}>No resume is available.</p>}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-default)" }}>
              <span className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>HR email status</span>
              <p className="mt-1 font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>{application.hrEmailStatus}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl p-4" style={{ background: "var(--bg-elev)" }}>
      <Icon className="mt-0.5 shrink-0" size={16} style={{ color: "var(--text-tertiary)" }} />
      <div>
        <span className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{label}</span>
        <span className="mt-1 block break-all font-medium text-sm" style={{ color: "var(--text-primary)" }}>{value}</span>
      </div>
    </div>
  );
}
