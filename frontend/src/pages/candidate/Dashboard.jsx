import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, FileText, UserRoundCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { applicationsApi } from "../../api/applications.js";
import { profileApi } from "../../api/profile.js";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";

export function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    Promise.all([profileApi.get(), applicationsApi.mine()]).then(([profile, applications]) =>
      setData({ profile: profile.data.data, applications: applications.data.data }),
    );
  }, []);
  if (!data) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading dashboard" /></div>;

  const recent = data.applications.slice(0, 3);
  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-brand-700">Candidate dashboard</p>
        <h1 className="page-heading mt-1">Welcome back, {data.profile.name}</h1>
        <p className="page-subheading">Keep your profile current and stay on top of your job applications.</p>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:p-6">
          <div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700 shadow-sm"><UserRoundCheck size={20} /></span><strong className="text-3xl text-brand-900">{data.profile.profileCompletion}%</strong></div>
          <h2 className="mt-5 font-bold text-brand-950">Profile completion</h2>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${data.profile.profileCompletion}%` }} /></div>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
          <div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><FileText size={20} /></span><strong className="text-3xl text-blue-950">{data.applications.length}</strong></div>
          <h2 className="mt-5 font-bold text-blue-950">Total applications</h2>
          <p className="mt-2 text-sm text-blue-700">All applications submitted through SaudiaCareers.</p>
        </article>
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="rounded-2xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Recent applications</h2><Link className="text-sm font-semibold text-brand-700 hover:underline" to="/dashboard/applications">View all</Link></div>
          <div className="mt-4 space-y-3">
            {recent.length ? recent.map((item) => <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4" key={item.id}><div className="min-w-0"><p className="truncate font-semibold">{item.job.title}</p><p className="truncate text-sm text-slate-500">{item.job.companyName}</p></div><span className="shrink-0 text-xs font-semibold text-slate-600">{item.status.replaceAll("_", " ")}</span></div>) : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No applications yet. Browse jobs to get started.</p>}
          </div>
        </section>
        <aside className="rounded-2xl bg-slate-900 p-6 text-white">
          <BriefcaseBusiness className="text-brand-300" size={24} />
          <h2 className="mt-4 text-xl font-bold">Ready for your next move?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Explore current opportunities across Saudi Arabia.</p>
          <Link className="mt-5 block" to="/jobs"><Button className="w-full">Browse jobs <ArrowRight size={16} /></Button></Link>
        </aside>
      </div>
    </div>
  );
}
