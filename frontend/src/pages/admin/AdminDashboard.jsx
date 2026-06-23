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
      <p className="section-label">Administration</p>
      <h1 className="page-title text-3xl md:text-4xl">Dashboard overview</h1>
      <p className="mt-2 mb-8 text-base" style={{ color: "var(--text-secondary)" }}>Monitor jobs, candidates, and application activity.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(metrics).map(([key, value]) => {
          const Icon = icons[key] ?? FileText;
          return (
            <article className="card-soft p-5" key={key}>
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                  <Icon size={19} />
                </span>
                <span className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{value}</span>
              </div>
              <p className="mt-5 font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{labels[key] ?? key}</p>
            </article>
          );
        })}
      </div>
      <div className="mt-6 rounded-2xl p-5 sm:p-6" style={{ background: "var(--accent-subtle)", border: "1px solid rgba(0,108,53,0.12)" }}>
        <h2 className="font-semibold" style={{ color: "var(--accent)" }}>Operational snapshot</h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--accent)" }}>Use Jobs to publish and manage openings, and Applications to review candidates and update outcomes.</p>
      </div>
    </div>
  );
}
