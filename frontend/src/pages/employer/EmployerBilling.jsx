import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const EMP = "var(--accent)";
const EMP_SUBTLE = "var(--accent-subtle)";

const INVOICE_STATUS_TONES = { PENDING: "amber", PAID: "green", REFUND_REQUESTED: "blue", REFUNDED: "neutral" };
const INVOICE_STATUS_LABELS = { PENDING: "Pending", PAID: "Paid", REFUND_REQUESTED: "Refund requested", REFUNDED: "Refunded" };
const INVOICE_TYPE_LABELS = { SUBSCRIPTION: "Plan subscription", CREDIT_PACK: "Job credit pack", REFUND: "Refund" };
const PLAN_CREDIT_CAP = { FREE: 1, STARTER: 5, GROWTH: 20 };

export function EmployerBilling() {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [pricePerCredit, setPricePerCredit] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        employerApi.getSubscription(),
        employerApi.listInvoices({ page: 1, limit: 20 }),
      ]);
      setSubscription(subRes.data.data.subscription);
      setPlans(subRes.data.data.plans);
      setPricePerCredit(subRes.data.data.pricePerCreditSar);
      setInvoices(invRes.data.data.invoices);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function run(action) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await action();
      setNotice(data.message);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="grid min-h-64 place-items-center"><Spinner label="Loading billing" /></div>;
  }

  const currentPlan = plans.find((p) => p.tier === subscription.planTier);
  const creditCap = PLAN_CREDIT_CAP[subscription.planTier] ?? 1;
  const creditUsedPct = Math.min(100, Math.round((subscription.paidCreditsRemaining / Math.max(creditCap, 1)) * 100));

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>Billing</h1>
      <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        Manage your plan, job credits, and invoices. Payments are confirmed manually by our team — no card details are collected here yet.
      </p>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.8fr]">
        <div className="rounded-3xl p-6" style={{ border: "1px solid rgba(244,67,54,0.25)", background: `linear-gradient(135deg, ${EMP_SUBTLE}, #fff 70%)` }}>
          <Badge tone="green">Current plan</Badge>
          <h2 className="mt-3 text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>{currentPlan?.name ?? subscription.planTier}</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {subscription.cancelAtPeriodEnd
              ? `Active until ${subscription.renewsAt ? formatDate(subscription.renewsAt) : "the end of this period"}, then reverts to Free.`
              : subscription.renewsAt
                ? `Renews on ${formatDate(subscription.renewsAt)}.`
                : "No active paid subscription."}
          </p>
          <p className="mt-4 text-4xl font-extrabold" style={{ color: "var(--text-primary)" }}>
            {currentPlan?.priceSar ?? 0} <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>SAR / month</span>
          </p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-bold" style={{ color: "var(--text-tertiary)" }}>
              <span>Paid credits remaining</span>
              <span>{subscription.paidCreditsRemaining} / {creditCap}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(244,67,54,0.15)" }}>
              <div className="h-full rounded-full" style={{ width: `${creditUsedPct}%`, background: EMP }} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={busy} style={{ background: EMP, borderColor: EMP }} onClick={() => run(() => employerApi.requestCreditPurchase(5))}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}Buy 5 extra credits
            </Button>
            {subscription.planTier !== "GROWTH" && (
              <Button variant="secondary" disabled={busy} onClick={() => run(() => employerApi.requestPlanChange(subscription.planTier === "FREE" ? "STARTER" : "GROWTH"))}>
                Upgrade plan
              </Button>
            )}
            {subscription.planTier !== "FREE" && !subscription.cancelAtPeriodEnd && (
              <Button variant="ghost" disabled={busy} onClick={() => run(() => employerApi.cancelSubscription())} style={{ color: "var(--text-tertiary)" }}>
                Cancel renewal
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Billing summary</h3>
          <dl className="mt-4 space-y-2.5">
            {[
              ["Paid credits remaining", subscription.paidCreditsRemaining],
              ["Free monthly job", subscription.freeJobUsedAt && new Date(subscription.freeJobUsedAt).getUTCMonth() === new Date().getUTCMonth() ? "Used this month" : "Available"],
              ["Price per extra credit", `${pricePerCredit} SAR`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm" style={{ background: "var(--bg-elev)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{value}</span>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <h2 className="mt-8 mb-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>Plans</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.tier}
            className="rounded-2xl p-6"
            style={{
              border: plan.tier === subscription.planTier ? `1.5px solid ${EMP}` : "1px solid var(--border-default)",
              background: "var(--bg-white)",
              boxShadow: plan.tier === subscription.planTier ? "var(--sh-2)" : "none",
            }}
          >
            {plan.tier === subscription.planTier && <Badge tone="green">Current</Badge>}
            <h3 className="mt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
            <p className="mt-1 text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              {plan.priceSar} <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>SAR/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                  <CheckCircle2 size={15} style={{ color: EMP, marginTop: "2px", flexShrink: 0 }} />{f}
                </li>
              ))}
            </ul>
            {plan.tier !== subscription.planTier && (
              <Button
                className="mt-5 w-full"
                variant="secondary"
                disabled={busy}
                onClick={() => run(() => employerApi.requestPlanChange(plan.tier))}
              >
                {plan.priceSar === 0 ? "Downgrade" : "Switch plan"}
              </Button>
            )}
          </div>
        ))}
      </div>

      <h2 className="mt-8 mb-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>Invoices</h2>
      {!invoices.length ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No invoices yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
          <table className="w-full text-sm">
            <thead style={{ background: "var(--bg-elev)" }}>
              <tr>
                {["Date", "Type", "Amount", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none", background: "var(--bg-white)" }}>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(inv.issuedAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>{INVOICE_TYPE_LABELS[inv.type] ?? inv.type}</p>
                    {inv.note && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{inv.note}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{inv.amountSar} SAR</td>
                  <td className="px-4 py-3"><Badge tone={INVOICE_STATUS_TONES[inv.status]}>{INVOICE_STATUS_LABELS[inv.status]}</Badge></td>
                  <td className="px-4 py-3">
                    {inv.status === "PAID" && inv.type !== "REFUND" && (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => employerApi.requestRefund(inv.id))}>
                        Request refund
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
