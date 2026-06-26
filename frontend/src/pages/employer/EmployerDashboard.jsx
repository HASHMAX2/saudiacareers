import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, FileText, PlusCircle, TrendingUp, Users } from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { Spinner } from "../../components/common/Spinner.jsx";
import { useAuthStore } from "../../store/authStore.js";

function MetricCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="card-soft p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
        <span
          className="grid h-9 w-9 place-items-center rounded-full"
          style={{ background: accent ? "var(--accent-subtle)" : "var(--bg-elev)", color: accent ? "var(--accent)" : "var(--text-tertiary)" }}
        >
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{value ?? "—"}</p>
    </div>
  );
}

export function EmployerDashboard() {
  const user = useAuthStore((state) => state.user);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    employerApi.getDashboard().then(({ data }) => setMetrics(data.data)).catch(() => {});
  }, []);

  return (
    <div>
      <p className="section-label">Employer</p>
      <h1 className="page-title text-3xl md:text-4xl">
        Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
      </h1>
      <p className="mt-2 mb-7 text-base" style={{ color: "var(--text-secondary)" }}>
        {"Here's an overview of your job listings and applicants."}
      </p>

      {!metrics ? (
        <div className="grid min-h-40 place-items-center"><Spinner label="Loading metrics" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard icon={Briefcase}   label="Total jobs"         value={metrics.totalJobs} />
          <MetricCard icon={TrendingUp}  label="Active listings"    value={metrics.activeJobs} accent />
          <MetricCard icon={Users}       label="Total applicants"   value={metrics.totalApplications} />
          <MetricCard icon={FileText}    label="New (last 7 days)"  value={metrics.newApplications} accent />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/employer/jobs/create"
          className="card-soft card-lift flex items-center gap-4 p-5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
            <PlusCircle size={19} />
          </span>
          <div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Post a new job</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Create a listing and start receiving applications.</p>
          </div>
        </Link>
        <Link
          to="/employer/jobs"
          className="card-soft card-lift flex items-center gap-4 p-5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}>
            <Briefcase size={19} />
          </span>
          <div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Manage listings</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Edit, unpublish, or review applicants per job.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
