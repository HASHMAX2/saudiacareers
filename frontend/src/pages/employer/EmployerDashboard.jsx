import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { employerApi } from "../../api/employer.js";
import { billingApi } from "../../api/billing.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const EMP = "var(--accent)";

const STATUS_META = {
  ACTIVE: { label: "Active", tone: "green" },
  INACTIVE: { label: "Inactive", tone: "amber" },
  DRAFT: { label: "Draft", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "red" },
};

const VERIFICATION_BANNER = {
  PENDING: { title: "Company verification pending", body: "Your company profile is under review. You can create job drafts, but publishing will unlock after approval.", tone: "amber" },
  APPROVED: { title: "Company verified", body: "You're all set — publish jobs using your free monthly listing or paid credits.", tone: "green" },
  REJECTED: { title: "Verification rejected", body: "Please review the reviewer's note on your Company Profile page and resubmit your document.", tone: "red" },
};

function KpiCard({ label, value, meta, accentBg }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)", boxShadow: "var(--sh-1)" }}>
      <span className="absolute -right-9 -top-9 h-24 w-24 rounded-full" style={{ background: accentBg }} aria-hidden="true" />
      <p className="relative text-xs font-bold" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="relative mt-2 text-[32px] font-extrabold leading-none" style={{ color: "var(--text-primary)" }}>{value}</p>
      <p className="relative mt-2 text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>{meta}</p>
    </div>
  );
}

export function EmployerDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      employerApi.getProfile(),
      employerApi.getDashboard(),
      billingApi.getSummary(),
      employerApi.listJobs({ page: 1, limit: 5 }),
    ]).then(([profileRes, dashRes, billingRes, jobsRes]) => {
      setData({
        profile: profileRes.data.data,
        metrics: dashRes.data.data,
        subscription: billingRes.data.data.subscription,
        jobs: jobsRes.data.data.jobs,
      });
    });
  }, []);

  if (!data) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading dashboard" /></div>;

  const { profile, metrics, subscription, jobs } = data;
  const banner = VERIFICATION_BANNER[profile.verificationStatus] ?? VERIFICATION_BANNER.PENDING;
  const freeJobUsedThisMonth = subscription.freeJobUsedAt &&
    new Date(subscription.freeJobUsedAt).getUTCMonth() === new Date().getUTCMonth() &&
    new Date(subscription.freeJobUsedAt).getUTCFullYear() === new Date().getUTCFullYear();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
            Track your job posts, applicants, and billing at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/employer/jobs"><Button variant="secondary">View jobs</Button></Link>
          {!profile.isSuspended && (
            <Link to="/employer/jobs/create"><Button style={{ background: EMP, borderColor: EMP }}>Post a job</Button></Link>
          )}
        </div>
      </div>

      {profile.isSuspended && (
        <div
          className="mb-6 rounded-2xl p-5"
          style={{ border: "1px solid #F5C2C2", background: "#FDECEC" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Your account has been suspended</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {profile.suspendedReason
                  ? `Reason: ${profile.suspendedReason}`
                  : "No reason was provided. Contact support for details."}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                You can still view your dashboard, jobs, and applications, but you can't post or publish new jobs until this is resolved.
                Please reach out to support to find out what needs to be corrected.
              </p>
            </div>
            <Badge tone="red">Suspended</Badge>
          </div>
        </div>
      )}

      <div
        className="mb-6 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
      >
        <div>
          <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>{banner.title}</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{banner.body}</p>
        </div>
        <Badge tone={banner.tone}>{profile.verificationStatus === "APPROVED" ? "Verified" : profile.verificationStatus === "REJECTED" ? "Rejected" : "Pending"}</Badge>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Active jobs" value={metrics.activeJobs} meta={`${metrics.totalJobs} total listings`} accentBg="var(--accent-subtle)" />
        <KpiCard label="Applications" value={metrics.totalApplications} meta={`${metrics.newApplications} new this week`} accentBg="var(--green-bg)" />
        <KpiCard label="Free job used" value={freeJobUsedThisMonth ? "1/1" : "0/1"} meta={freeJobUsedThisMonth ? "Resets next month" : "Available this month"} accentBg="var(--gold-bg)" />
        <KpiCard label="Paid credits" value={subscription.paidCreditsRemaining} meta={`${subscription.planTier} plan`} accentBg="var(--purple-bg)" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <div>
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Recent jobs</h3>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>Your most recently posted listings.</p>
            </div>
            <Link to="/employer/jobs"><Button size="sm" variant="secondary">View all</Button></Link>
          </div>
          {!jobs.length ? (
            <p className="p-5 text-sm" style={{ color: "var(--text-secondary)" }}>No jobs posted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: "var(--bg-elev)" }}>
                  <tr>
                    {["Role", "Status", "Applicants", "Posted"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} style={{ borderTop: "1px solid var(--border-default)" }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.location}</p>
                      </td>
                      <td className="px-4 py-3"><Badge tone={STATUS_META[job.status]?.tone ?? "neutral"}>{STATUS_META[job.status]?.label ?? job.status}</Badge></td>
                      <td className="px-4 py-3 font-semibold" style={{ color: EMP }}>{job._count.applications}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(job.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Billing summary</h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>Your current plan, job credits, and billing status.</p>
          <dl className="mt-4 space-y-2.5">
            {[
              ["Current plan", subscription.planTier],
              ["Paid credits", `${subscription.paidCreditsRemaining} remaining`],
              ["Free monthly job", freeJobUsedThisMonth ? "Used" : "Available"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm" style={{ background: "var(--bg-elev)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{value}</span>
              </div>
            ))}
          </dl>
          <Link to="/employer/billing">
            <Button className="mt-4 w-full" style={{ background: EMP, borderColor: EMP }}>Manage billing</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
