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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm font-semibold text-brand-700">Application #{application.id}</p><h1 className="page-heading mt-1">{application.user.name}</h1><p className="page-subheading">Applied for {application.job.title} on {formatDate(application.appliedAt)}</p></div>
        <Badge tone={statusTone[application.status]}>{application.status.replaceAll("_", " ")}</Badge>
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 p-5 sm:p-6"><h2 className="flex items-center gap-2 font-bold"><UserRound size={18} className="text-brand-700" />Candidate information</h2><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><Info icon={Mail} label="Email" value={application.user.email} /><Info icon={Phone} label="Mobile" value={application.user.mobile} /><Info icon={MapPin} label="Location" value={profile?.location || "Not provided"} /><Info icon={FileText} label="Experience" value={profile?.experience || "Not provided"} /></div></section>
          <section className="rounded-2xl border border-slate-200 p-5 sm:p-6"><h2 className="font-bold">Professional profile</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="font-semibold text-slate-500">Designation</dt><dd className="mt-1 text-slate-800">{profile?.designation || "Not provided"}</dd></div><div><dt className="font-semibold text-slate-500">Skills</dt><dd className="mt-1 text-slate-800">{profile?.skills || "Not provided"}</dd></div><div><dt className="font-semibold text-slate-500">Professional summary</dt><dd className="mt-1 leading-6 text-slate-800">{profile?.summary || "Not provided"}</dd></div></dl></section>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-slate-200 p-5"><h2 className="font-bold">Application status</h2><select className="form-control mt-4" value={application.status} onChange={async (event) => { await adminApi.updateApplicationStatus(id, event.target.value); load(); }}><option>APPLIED</option><option>UNDER_REVIEW</option><option>SELECTED</option><option>REJECTED</option></select><p className="mt-3 text-xs leading-5 text-slate-500">Changing status sends an email notification to the candidate.</p></section>
          <section className="rounded-2xl border border-slate-200 p-5"><h2 className="font-bold">Resume</h2>{application.resumeUrl ? <Button className="mt-4 w-full" onClick={() => window.open(application.resumeUrl, "_blank")}><Download size={16} />Download resume</Button> : <p className="mt-3 text-sm text-slate-500">No resume is available.</p>}<div className="mt-4 border-t border-slate-100 pt-4 text-sm"><span className="text-slate-500">HR email status</span><p className="mt-1 font-semibold">{application.hrEmailStatus}</p></div></section>
        </aside>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return <div className="flex gap-3 rounded-xl bg-slate-50 p-4"><Icon className="mt-0.5 shrink-0 text-slate-400" size={17} /><div><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span><span className="mt-1 block break-all font-medium text-slate-800">{value}</span></div></div>;
}
