import { useEffect, useState } from "react";
import { BriefcaseBusiness, FileText, UserRound, Zap } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Spinner } from "../../components/common/Spinner.jsx";

const icons = { jobs: BriefcaseBusiness, activeJobs: Zap, applications: FileText, candidates: UserRound };
const labels = { jobs: "Total jobs", activeJobs: "Active jobs", applications: "Applications", candidates: "Candidates" };

export function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => { adminApi.dashboard().then(({ data }) => setMetrics(data.data)); }, []);
  if (!metrics) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading metrics" /></div>;
  return (
    <div>
      <p className="text-sm font-semibold text-brand-700">Administration</p>
      <h1 className="page-heading mt-1">Dashboard overview</h1>
      <p className="page-subheading">Monitor jobs, candidates, and application activity.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(metrics).map(([key, value]) => {
          const Icon = icons[key] ?? FileText;
          return <article className="rounded-2xl border border-slate-200 p-5 shadow-sm" key={key}><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={20} /></span><span className="text-3xl font-bold tracking-tight">{value}</span></div><p className="mt-5 text-sm font-semibold text-slate-600">{labels[key] ?? key}</p></article>;
        })}
      </div>
      <div className="mt-7 rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:p-6"><h2 className="font-bold text-brand-950">Operational snapshot</h2><p className="mt-2 text-sm leading-6 text-brand-800">Use Jobs to publish and manage openings, and Applications to review candidates and update outcomes.</p></div>
    </div>
  );
}
