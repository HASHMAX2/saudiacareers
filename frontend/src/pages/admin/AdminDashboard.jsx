import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, FileText, ShieldCheck, UserRound, Zap } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const icons = { jobs: BriefcaseBusiness, activeJobs: Zap, applications: FileText, candidates: UserRound };
const labels = { jobs: "Total jobs", activeJobs: "Active jobs", applications: "Applications", candidates: "Candidates" };

function initialsOf(name) {
  return (name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function SlaBadge({ sla }) {
  if (!sla) return null;
  if (sla.breached) return <Badge tone="red">Breached</Badge>;
  if (sla.hoursRemaining < 4) return <Badge tone="amber">{sla.hoursRemaining}h left</Badge>;
  return <Badge tone="green">{sla.hoursRemaining}h left</Badge>;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState(null);
  const [flaggedJobs, setFlaggedJobs] = useState(null);
  const [refunds, setRefunds] = useState(null);

  useEffect(() => {
    adminApi.dashboard().then(({ data }) => setMetrics(data.data));
    adminApi.pendingVerifications({ page: 1, limit: 3 }).then(({ data }) => setPendingVerifications(data.data.profiles));
    adminApi.flaggedJobs().then(({ data }) => setFlaggedJobs(data.data.slice(0, 3)));
    adminApi.invoices({ status: "REFUND_REQUESTED", page: 1, limit: 3 }).then(({ data }) => setRefunds(data.data.invoices));
  }, []);

  if (!metrics) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading dashboard" /></div>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Administration</p>
          <h1 className="page-title text-3xl md:text-4xl">Dashboard</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
            Action-first overview — employer approvals, flagged jobs, and refund requests that need attention.
          </p>
        </div>
        <Link to="/admin/verifications"><Button>Review employers</Button></Link>
      </div>

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

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <div>
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Employer approval queue</h2>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>Ranked by submission time.</p>
            </div>
            <Link to="/admin/verifications" className="text-sm font-semibold hover:underline" style={{ color: "var(--accent)" }}>Open all</Link>
          </div>
          {!pendingVerifications ? (
            <div className="grid min-h-32 place-items-center"><Spinner label="Loading" /></div>
          ) : !pendingVerifications.length ? (
            <div className="p-8 text-center">
              <ShieldCheck className="mx-auto" size={26} style={{ color: "var(--text-tertiary)" }} />
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Nothing pending review.</p>
            </div>
          ) : (
            <div>
              {pendingVerifications.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-4" style={{ borderTop: i ? "1px solid var(--border-default)" : "none" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                      {initialsOf(p.companyName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{p.companyName}</p>
                      <p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>Submitted {formatDate(p.sla.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <SlaBadge sla={p.sla} />
                    <Link to="/admin/verifications"><Button size="sm" variant="secondary">Review</Button></Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <div className="p-5" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Critical operations</h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>Things that can affect trust, money, or job quality.</p>
          </div>
          <div>
            {flaggedJobs?.map((job, i) => (
              <div key={`job-${job.id}`} className="flex items-center justify-between gap-3 p-4" style={{ borderTop: i ? "1px solid var(--border-default)" : "none" }}>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                  <p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{job._count.reports} report{job._count.reports !== 1 ? "s" : ""} · {job.reports[0]?.reason.replaceAll("_", " ").toLowerCase()}</p>
                </div>
                <Link to="/admin/jobs-flagged"><Button size="sm" variant="danger">Moderate</Button></Link>
              </div>
            ))}
            {refunds?.map((inv, i) => (
              <div key={`inv-${inv.id}`} className="flex items-center justify-between gap-3 p-4" style={{ borderTop: (i || flaggedJobs?.length) ? "1px solid var(--border-default)" : "none" }}>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{inv.employerProfile?.companyName} refund request</p>
                  <p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{inv.amountSar} SAR · {inv.note}</p>
                </div>
                <Link to="/admin/refunds"><Button size="sm" variant="secondary">Review</Button></Link>
              </div>
            ))}
            {flaggedJobs && refunds && !flaggedJobs.length && !refunds.length && (
              <div className="p-8 text-center">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Nothing critical right now.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
