import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const STATUS_META = {
  ACTIVE: { label: "Active", tone: "green" },
  PENDING_APPROVAL: { label: "Pending approval", tone: "amber" },
  CANCELLING: { label: "Cancelling", tone: "neutral" },
};

const PLAN_TONES = { FREE: "neutral", STARTER: "blue", GROWTH: "blue" };

export function AdminBilling() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);

  async function load(p = page) {
    const { data: res } = await adminApi.billingOverview({ page: p, limit: 20 });
    setData(res.data);
  }

  useEffect(() => { load(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const employers = data?.employers ?? null;
  const activeCount = employers?.filter((e) => e.status === "ACTIVE" && e.planTier !== "FREE").length ?? 0;
  const cancellingCount = employers?.filter((e) => e.status === "CANCELLING").length ?? 0;

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Billing</h1>
      <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        Subscription status, renewal dates, and job credit usage across every employer.
      </p>

      {!employers ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading billing overview" /></div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <article className="card-soft p-5">
              <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Paid employers (this page)</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{activeCount}</p>
            </article>
            <article className="card-soft p-5">
              <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Scheduled to cancel</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{cancellingCount}</p>
            </article>
          </div>

          {!employers.length ? (
            <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
              <Wallet className="mx-auto" size={28} style={{ color: "var(--text-tertiary)" }} />
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No employers found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
              <table className="w-full text-sm">
                <thead style={{ background: "var(--bg-elev)" }}>
                  <tr>
                    {["Employer", "Plan", "Status", "Job credits", "Renews / resets", "Action"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employers.map((e, i) => {
                    const meta = STATUS_META[e.status] ?? STATUS_META.ACTIVE;
                    return (
                      <tr key={e.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none", background: "var(--bg-white)" }}>
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{e.companyName}</td>
                        <td className="px-4 py-3"><Badge tone={PLAN_TONES[e.planTier]}>{e.planTier}</Badge></td>
                        <td className="px-4 py-3"><Badge tone={meta.tone}>{meta.label}</Badge></td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{e.paidCreditsRemaining} remaining</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{e.renewsAt ? formatDate(e.renewsAt) : "—"}</td>
                        <td className="px-4 py-3">
                          <Link to={`/admin/verifications/${e.id}`}><Button size="sm" variant="secondary">Manage</Button></Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data.pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={(p) => { setPage(p); load(p); }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
