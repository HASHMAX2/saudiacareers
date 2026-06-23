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
        <p className="section-label">Candidate dashboard</p>
        <h1 className="page-title text-3xl md:text-4xl">Welcome back, {data.profile.name}</h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>Keep your profile current and stay on top of your job applications.</p>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="card-soft p-5 sm:p-6" style={{ background: "var(--accent-subtle)", border: "1px solid rgba(0,108,53,0.12)" }}>
          <div className="flex items-start justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white" style={{ color: "var(--accent)" }}>
              <UserRoundCheck size={19} />
            </span>
            <strong className="text-3xl font-bold" style={{ color: "var(--accent)" }}>{data.profile.profileCompletion}%</strong>
          </div>
          <h2 className="mt-5 font-semibold" style={{ color: "var(--text-primary)" }}>Profile completion</h2>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(0,108,53,0.15)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${data.profile.profileCompletion}%`, background: "var(--accent)" }} />
          </div>
        </article>
        <article className="card-soft p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600">
              <FileText size={19} />
            </span>
            <strong className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{data.applications.length}</strong>
          </div>
          <h2 className="mt-5 font-semibold" style={{ color: "var(--text-primary)" }}>Total applications</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>All applications submitted through SaudiaCareers.</p>
        </article>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_20rem]">
        <section className="card-soft p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Recent applications</h2>
            <Link className="font-mono text-xs hover:underline" style={{ color: "var(--accent)" }} to="/dashboard/applications">View all</Link>
          </div>
          <div className="space-y-3">
            {recent.length ? recent.map((item) => (
              <div className="flex items-center justify-between gap-4 rounded-xl p-4" style={{ background: "var(--bg-elev)" }} key={item.id}>
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm" style={{ color: "var(--text-primary)" }}>{item.job.title}</p>
                  <p className="truncate text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{item.job.companyName}</p>
                </div>
                <span className="chip shrink-0 text-xs">{item.status.replaceAll("_", " ")}</span>
              </div>
            )) : (
              <p className="rounded-xl p-5 text-sm" style={{ background: "var(--bg-elev)", color: "var(--text-secondary)" }}>
                No applications yet. Browse jobs to get started.
              </p>
            )}
          </div>
        </section>
        <aside className="rounded-2xl p-6 text-white" style={{ background: "#1A1A19" }}>
          <BriefcaseBusiness size={22} style={{ color: "var(--accent)" }} />
          <h2 className="mt-4 text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Ready for your next move?</h2>
          <p className="mt-2 text-sm leading-6" style={{ color: "rgba(255,255,255,0.55)" }}>Explore current opportunities across Saudi Arabia.</p>
          <Link className="mt-5 block" to="/jobs">
            <Button className="w-full">Browse jobs <ArrowRight size={16} /></Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
