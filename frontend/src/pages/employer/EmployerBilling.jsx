import { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  ChevronDown,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  FolderOpen,
  HardDrive,
  Loader2,
  MapPin,
  Receipt,
  Unlock,
} from "lucide-react";
import { billingApi } from "../../api/billing.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { Toast } from "../../components/common/Toast.jsx";
import { EmptyState } from "../../components/dashboard/EmptyState.jsx";
import { formatDate } from "../../utils/formatDate.js";

const EMP = "var(--accent)";
const EMP_SUBTLE = "var(--accent-subtle)";
const NOTICE_DURATION = 3500;

const INVOICE_STATUS_TONES = { PENDING: "amber", PAID: "green", FAILED: "red", REFUND_REQUESTED: "blue", REFUNDED: "neutral" };
const INVOICE_STATUS_LABELS = { PENDING: "Pending", PAID: "Paid", FAILED: "Failed", REFUND_REQUESTED: "Refund requested", REFUNDED: "Refunded" };
const INVOICE_TYPE_LABELS = { SUBSCRIPTION: "Plan subscription", CREDIT_PACK: "Job credit pack", REFUND: "Refund" };
const TRANSACTION_TYPE_LABELS = { CHARGE: "Charge", REFUND: "Refund", FAILED_CHARGE: "Failed charge" };

const FAQ_ITEMS = [
  {
    q: "How does billing work on SaudiaCareers?",
    a: "You're billed monthly for your plan. Job postings beyond your plan's free/paid credits require buying extra credits.",
  },
  {
    q: "Can I change plans at any time?",
    a: "Yes — upgrades and downgrades take effect based on the proration mode shown in the change-plan preview before you confirm.",
  },
  {
    q: "What happens if I cancel?",
    a: "Your plan stays active until the end of the current billing period, then your account moves to the Free plan automatically.",
  },
  {
    q: "How do refunds work?",
    a: "Submit a refund request from a paid invoice. Our team reviews it, and approved refunds are issued back to your original payment method.",
  },
  {
    q: "Is my card information stored on SaudiaCareers?",
    a: "No — card details are handled entirely by our payment gateway. We only ever store a reference id, plus the card brand/last 4 digits for display.",
  },
];

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ProgressBar({ value, max, label, valueLabel, icon: Icon }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
        <span className="flex items-center gap-1.5">{Icon && <Icon size={13} />}{label}</span>
        <span style={{ color: "var(--text-primary)" }}>{valueLabel}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--bg-elev)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: EMP }} />
      </div>
    </div>
  );
}

export function EmployerBilling() {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showNotice, setShowNotice] = useState(false);
  const noticeTimerRef = useRef(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState(null);

  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactions, setTransactions] = useState(null);

  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => () => clearTimeout(noticeTimerRef.current), []);

  function showToastNotice(message) {
    clearTimeout(noticeTimerRef.current);
    setNotice(message);
    setShowNotice(true);
    noticeTimerRef.current = setTimeout(() => setShowNotice(false), NOTICE_DURATION);
  }

  async function load() {
    setLoading(true);
    try {
      const [summaryRes, invRes] = await Promise.all([
        billingApi.getSummary(),
        billingApi.listInvoices({ page: 1, limit: 20 }),
      ]);
      setSummary(summaryRes.data.data);
      setInvoices(invRes.data.data.invoices);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Every write action either resolves immediately (toast + reload) or hands
  // back a Dodo-hosted checkoutUrl the employer must be redirected to — card
  // entry always happens on Dodo's side, never in our own UI.
  async function run(action, actionName) {
    setBusy(true);
    setBusyAction(actionName);
    setError("");
    try {
      const { data } = await action();
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
        return;
      }
      showToastNotice(data.message);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  async function handleConfirmCancel() {
    setBusy(true);
    setError("");
    try {
      const { data } = await billingApi.cancelSubscription();
      const dateStr = data.data?.renewsAt ? formatDate(data.data.renewsAt) : "the end of this period";
      setShowCancelModal(false);
      showToastNotice(`Cancellation scheduled. Your plan remains active until ${dateStr}, then your account moves to Free.`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to cancel subscription");
    } finally {
      setBusy(false);
    }
  }

  async function openPlanModal(tier) {
    setSelectedTier(tier);
    setPreview(null);
    setShowPlanModal(true);
    setPreviewing(true);
    try {
      const { data } = await billingApi.previewPlanChange(tier);
      setPreview(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to preview this plan change");
      setShowPlanModal(false);
    } finally {
      setPreviewing(false);
    }
  }

  async function confirmPlanChange() {
    setBusy(true);
    setError("");
    try {
      const { data } = await billingApi.changePlan(selectedTier);
      setShowPlanModal(false);
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
        return;
      }
      showToastNotice(data.message);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to change plan");
    } finally {
      setBusy(false);
    }
  }

  function openProfileModal() {
    const p = summary.subscription;
    setProfileForm({
      taxRegistrationNumber: p.taxRegistrationNumber || "",
      billingEmail: p.billingEmail || "",
      billingAddressLine1: p.billingAddressLine1 || "",
      billingAddressLine2: p.billingAddressLine2 || "",
      billingCity: p.billingCity || "",
      billingState: p.billingState || "",
      billingPostalCode: p.billingPostalCode || "",
      billingCountry: p.billingCountry || "SA",
    });
    setShowProfileModal(true);
  }

  async function saveProfile() {
    setBusy(true);
    setError("");
    try {
      await billingApi.updateBillingProfile(profileForm);
      setShowProfileModal(false);
      showToastNotice("Billing profile updated");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to update billing profile");
    } finally {
      setBusy(false);
    }
  }

  async function openTransactions() {
    setShowTransactionsModal(true);
    setTransactions(null);
    const { data } = await billingApi.listTransactions({ page: 1, limit: 30 });
    setTransactions(data.data.transactions);
  }

  async function handleDownloadPdf(invoiceId) {
    setDownloadingInvoiceId(invoiceId);
    try {
      const { data } = await billingApi.downloadInvoicePdf(invoiceId);
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  async function handleDownloadAll() {
    setDownloadingAll(true);
    try {
      const { data } = await billingApi.downloadAllInvoices();
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "invoices.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingAll(false);
    }
  }

  async function handlePayNow(invoiceId) {
    setPayingInvoiceId(invoiceId);
    setError("");
    try {
      const { data } = await billingApi.payInvoiceNow(invoiceId);
      if (data.data?.checkoutUrl) window.location.href = data.data.checkoutUrl;
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to start checkout");
    } finally {
      setPayingInvoiceId(null);
    }
  }

  if (loading && !summary) {
    return <div className="grid min-h-64 place-items-center"><Spinner label="Loading billing" /></div>;
  }

  const { subscription, plans, currentPlan, paymentMethod, pendingInvoice, upcomingCharge, usage, dodoConfigured } = summary;
  const canCancel = subscription.planTier !== "FREE" && !subscription.cancelAtPeriodEnd;
  const canResume = subscription.planTier !== "FREE" && subscription.cancelAtPeriodEnd;
  const jobsCap = currentPlan?.paidCreditsGranted + 1 || 1;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Finance workspace</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>Billing</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
            Manage your plan, payment method, invoices, and usage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCancel && (
            <Button variant="secondary" disabled={busy} onClick={() => setShowCancelModal(true)}>Cancel plan</Button>
          )}
          {canResume && (
            <Button variant="secondary" disabled={busy} onClick={() => run(() => billingApi.resumeSubscription(), "resume")}>
              {busyAction === "resume" ? <><Loader2 size={14} className="animate-spin shrink-0" />Resuming…</> : "Resume plan"}
            </Button>
          )}
        </div>
      </div>

      <Toast show={showNotice} message={notice} tone="success" duration={NOTICE_DURATION} />
      {error && <Alert>{error}</Alert>}
      {!dodoConfigured && (
        <div className="mb-5 rounded-2xl px-4 py-3 text-sm" style={{ border: "1px solid var(--gold-ink)", background: "var(--gold-bg)", color: "var(--gold-ink)" }}>
          Payment gateway isn&apos;t fully configured yet — plan changes, payments, and payment-method updates aren&apos;t available until it is.
        </div>
      )}

      {/* Hero: current plan + upcoming charge */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl p-6 text-white" style={{ background: "var(--bg-dark)" }}>
          <Badge tone="green">Current subscription</Badge>
          <h2 className="mt-3 text-2xl font-extrabold">{currentPlan?.name ?? subscription.planTier}</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-on-dark-secondary)" }}>
            {subscription.cancelAtPeriodEnd
              ? `Active until ${subscription.renewsAt ? formatDate(subscription.renewsAt) : "the end of this period"}, then reverts to Free.`
              : subscription.renewsAt
                ? `Renews on ${formatDate(subscription.renewsAt)}.`
                : "No active paid subscription."}
          </p>
          <p className="mt-4 text-4xl font-extrabold">
            {currentPlan?.priceSar ?? 0} <span className="text-sm font-semibold" style={{ color: "var(--text-on-dark-secondary)" }}>SAR / month</span>
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["Next renewal", subscription.renewsAt ? formatDate(subscription.renewsAt) : "—"],
              ["Billing cycle", "Monthly"],
              ["Auto-renewal", subscription.cancelAtPeriodEnd ? "Off" : "On"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-on-dark-secondary)" }}>{label}</p>
                <p className="mt-1 text-sm font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button style={{ background: EMP, borderColor: EMP }} disabled={busy} onClick={() => document.getElementById("plan-matrix")?.scrollIntoView({ behavior: "smooth" })}>
              Change plan
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !dodoConfigured}
              style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.35)" }}
              onClick={() => run(() => billingApi.purchaseCredits(5), "buyCredits")}
            >
              {busyAction === "buyCredits" ? <><Loader2 size={14} className="animate-spin shrink-0" />Processing…</> : "Buy 5 extra credits"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
            <div className="flex items-center gap-2">
              <Receipt size={16} style={{ color: EMP }} />
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Upcoming charge</h3>
            </div>
            {upcomingCharge ? (
              <>
                <p className="mt-3 text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>{upcomingCharge.totalSar} SAR</p>
                <dl className="mt-3 space-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <div className="flex justify-between"><dt>Base plan</dt><dd>{upcomingCharge.baseSar} SAR</dd></div>
                  <div className="flex justify-between"><dt>Taxes</dt><dd>{upcomingCharge.taxSar} SAR</dd></div>
                  <div className="flex justify-between"><dt>Discount</dt><dd>-{upcomingCharge.discountSar} SAR</dd></div>
                </dl>
              </>
            ) : (
              <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>Nothing due — you&apos;re on the Free plan.</p>
            )}

            <div className="mt-4 flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bg-elev)" }}>
              <CreditCard size={18} style={{ color: "var(--text-tertiary)" }} />
              <div className="min-w-0 flex-1">
                {paymentMethod ? (
                  <>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{paymentMethod.cardBrand} •••• {paymentMethod.cardLast4}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}</p>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No payment method on file</p>
                )}
              </div>
              <button type="button" className="flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50" style={{ color: EMP }} disabled={busy || !dodoConfigured} onClick={() => run(() => billingApi.updatePaymentMethod(), "updatePayment")}>
                {busyAction === "updatePayment" ? <><Loader2 size={12} className="animate-spin shrink-0" />Updating…</> : "Update"}
              </button>
            </div>

            {pendingInvoice && (
              <Button className="mt-4 w-full" disabled={busy || payingInvoiceId === pendingInvoice.id || !dodoConfigured} onClick={() => handlePayNow(pendingInvoice.id)}>
                {payingInvoiceId === pendingInvoice.id ? <Loader2 size={14} className="animate-spin" /> : null}Pay now — {pendingInvoice.amountSar} SAR
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Usage pulse + plan matrix */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Usage pulse</h3>
            {usage.cycleElapsedPct != null && <Badge tone="blue">{usage.cycleElapsedPct}% of cycle elapsed</Badge>}
          </div>
          <div className="mt-4 space-y-4">
            <ProgressBar icon={Briefcase} label="Jobs posted" value={usage.jobsPostedThisCycle} max={jobsCap} valueLabel={`${usage.jobsPostedThisCycle} / ${jobsCap}`} />
            <ProgressBar icon={Unlock} label="Resume unlocks" value={usage.resumeUnlocksThisCycle} max={Math.max(usage.resumeUnlocksThisCycle, 20)} valueLabel={usage.resumeUnlocksThisCycle} />
            <ProgressBar icon={HardDrive} label="Storage used" value={usage.storageUsedBytes} max={Math.max(usage.storageUsedBytes, 25 * 1024 * 1024)} valueLabel={formatBytes(usage.storageUsedBytes)} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: "var(--bg-elev)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Applications</p>
              <p className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{usage.applicationsThisCycle}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "var(--bg-elev)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Active listings</p>
              <p className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{usage.activeJobListings}</p>
            </div>
          </div>
        </div>

        <div id="plan-matrix" className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <table className="w-full text-left text-sm">
            <thead style={{ background: "var(--bg-elev)" }}>
              <tr>
                {["Plan", "Price", "Job credits", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.filter((p) => p.tier !== "FREE").map((plan, i) => (
                <tr key={plan.tier} style={{ borderTop: i ? "1px solid var(--border-default)" : "none" }}>
                  <td className="px-4 py-3">
                    <p className="font-bold" style={{ color: "var(--text-primary)" }}>{plan.name}</p>
                    {plan.tier === subscription.planTier && <Badge tone="green">Current</Badge>}
                    <ul className="mt-1 space-y-0.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                          <CheckCircle2 size={12} style={{ color: EMP, marginTop: "3px", flexShrink: 0 }} />{f}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{plan.priceSar} SAR/mo</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{plan.paidCreditsGranted}</td>
                  <td className="px-4 py-3">
                    {plan.tier !== subscription.planTier && (
                      <Button size="sm" variant="secondary" disabled={busy || !dodoConfigured} onClick={() => openPlanModal(plan.tier)}>Switch</Button>
                    )}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid var(--border-default)" }}>
                <td className="px-4 py-3">
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>Free</p>
                  {subscription.planTier === "FREE" && <Badge tone="green">Current</Badge>}
                </td>
                <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>0 SAR/mo</td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>1 free job/mo</td>
                <td className="px-4 py-3">
                  {subscription.planTier !== "FREE" && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setShowCancelModal(true)}>Downgrade</Button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice ledger + billing profile / quick actions */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Invoice ledger</h3>
            <Button size="sm" variant="secondary" disabled={downloadingAll || !invoices.length} onClick={handleDownloadAll}>
              {downloadingAll ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}Download all
            </Button>
          </div>
          {!invoices.length ? (
            <EmptyState icon={Receipt} title="No invoices yet" description="Your invoices will appear here once you're on a paid plan." />
          ) : (
            <div className="overflow-x-auto">
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
                    <tr key={inv.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none" }}>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(inv.issuedAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>{INVOICE_TYPE_LABELS[inv.type] ?? inv.type}</p>
                        {inv.note && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{inv.note}</p>}
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{inv.amountSar} SAR</td>
                      <td className="px-4 py-3"><Badge tone={INVOICE_STATUS_TONES[inv.status]}>{INVOICE_STATUS_LABELS[inv.status]}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {inv.status === "PENDING" && (
                            <Button size="sm" disabled={busy || payingInvoiceId === inv.id || !dodoConfigured} onClick={() => handlePayNow(inv.id)}>
                              {payingInvoiceId === inv.id ? <Loader2 size={12} className="animate-spin" /> : null}Pay now
                            </Button>
                          )}
                          {inv.status === "PAID" && inv.type !== "REFUND" && (
                            <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => billingApi.requestRefund(inv.id), `refund-${inv.id}`)}>
                              {busyAction === `refund-${inv.id}` ? <><Loader2 size={13} className="animate-spin shrink-0" />Requesting…</> : "Request refund"}
                            </Button>
                          )}
                          <button type="button" aria-label="Download PDF" disabled={downloadingInvoiceId === inv.id} onClick={() => handleDownloadPdf(inv.id)} style={{ color: "var(--text-tertiary)" }}>
                            {downloadingInvoiceId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Billing profile</h3>
            <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" />
                {subscription.billingAddressLine1
                  ? [subscription.billingAddressLine1, subscription.billingCity, subscription.billingCountry].filter(Boolean).join(", ")
                  : "No billing address on file"}
              </p>
              <p>Tax ID: {subscription.taxRegistrationNumber || "Not provided"}</p>
            </div>
            <Button size="sm" variant="secondary" className="mt-3" onClick={openProfileModal}>Edit billing profile</Button>
          </div>

          <div className="rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Quick actions</h3>
            <ul className="mt-3 divide-y" style={{ borderColor: "var(--border-default)" }}>
              {[
                { icon: Download, label: "Download all invoices", onClick: handleDownloadAll, loading: downloadingAll },
                { icon: FileText, label: "Update tax / GST details", onClick: openProfileModal },
                { icon: CreditCard, label: "Change payment method", onClick: () => run(() => billingApi.updatePaymentMethod(), "updatePayment"), disabled: !dodoConfigured, loading: busyAction === "updatePayment" },
                { icon: FolderOpen, label: "Transaction history", onClick: openTransactions },
              ].map(({ icon: Icon, label, onClick, disabled, loading }) => (
                <li key={label}>
                  <button type="button" className="flex w-full items-center gap-3 py-3 text-left text-sm disabled:opacity-50" disabled={disabled || loading} onClick={onClick}>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: EMP_SUBTLE, color: EMP }}>
                      {loading ? <Loader2 size={15} className="animate-spin shrink-0" /> : <Icon size={15} />}
                    </span>
                    <span className="flex-1" style={{ color: "var(--text-primary)" }}>{label}</span>
                    <ChevronDown size={14} style={{ color: "var(--text-tertiary)", transform: "rotate(-90deg)" }} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 rounded-2xl p-6" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Frequently asked questions</h3>
        <div className="mt-4 divide-y" style={{ borderColor: "var(--border-default)" }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={item.q} className="py-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                {item.q}
                <ChevronDown size={16} style={{ transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }} />
              </button>
              {openFaq === i && <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{item.a}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Cancel modal */}
      <Modal isOpen={showCancelModal} title="Cancel subscription?" onClose={() => setShowCancelModal(false)}>
        <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          Your <strong style={{ color: "var(--text-primary)" }}>{currentPlan?.name ?? subscription.planTier}</strong> plan will remain active until{" "}
          <strong style={{ color: "var(--text-primary)" }}>{subscription.renewsAt ? formatDate(subscription.renewsAt) : "the end of this period"}</strong>.
          After this date, your account moves to the Free plan.
        </p>
        {error && <div className="mt-3"><Alert>{error}</Alert></div>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => setShowCancelModal(false)}>Keep my plan</Button>
          <Button variant="danger" disabled={busy} onClick={handleConfirmCancel}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}Confirm cancellation
          </Button>
        </div>
      </Modal>

      {/* Plan change modal */}
      <Modal isOpen={showPlanModal} title={`Switch to ${selectedTier ?? ""}`} onClose={() => setShowPlanModal(false)}>
        {previewing ? (
          <div className="grid min-h-24 place-items-center"><Spinner label="Calculating charge" /></div>
        ) : preview ? (
          <>
            <dl className="space-y-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <div className="flex justify-between"><dt>Base plan</dt><dd>{preview.baseSar} SAR</dd></div>
              <div className="flex justify-between"><dt>Taxes</dt><dd>{preview.taxSar} SAR</dd></div>
              <div className="flex justify-between font-bold" style={{ color: "var(--text-primary)" }}><dt>Total due now</dt><dd>{preview.totalSar} SAR</dd></div>
            </dl>
            {error && <div className="mt-3"><Alert>{error}</Alert></div>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => setShowPlanModal(false)}>Cancel</Button>
              <Button disabled={busy} onClick={confirmPlanChange}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : null}Confirm switch
              </Button>
            </div>
          </>
        ) : null}
      </Modal>

      {/* Billing profile modal */}
      <Modal isOpen={showProfileModal} title="Edit billing profile" onClose={() => setShowProfileModal(false)}>
        {profileForm && (
          <div className="space-y-3">
            <label className="block">
              <span className="field-label">Tax / VAT registration number</span>
              <input className="field-box" value={profileForm.taxRegistrationNumber} onChange={(e) => setProfileForm({ ...profileForm, taxRegistrationNumber: e.target.value })} />
            </label>
            <label className="block">
              <span className="field-label">Billing email</span>
              <input className="field-box" type="email" value={profileForm.billingEmail} onChange={(e) => setProfileForm({ ...profileForm, billingEmail: e.target.value })} />
            </label>
            <label className="block">
              <span className="field-label">Address line 1</span>
              <input className="field-box" value={profileForm.billingAddressLine1} onChange={(e) => setProfileForm({ ...profileForm, billingAddressLine1: e.target.value })} />
            </label>
            <label className="block">
              <span className="field-label">Address line 2</span>
              <input className="field-box" value={profileForm.billingAddressLine2} onChange={(e) => setProfileForm({ ...profileForm, billingAddressLine2: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="field-label">City</span>
                <input className="field-box" value={profileForm.billingCity} onChange={(e) => setProfileForm({ ...profileForm, billingCity: e.target.value })} />
              </label>
              <label className="block">
                <span className="field-label">State / region</span>
                <input className="field-box" value={profileForm.billingState} onChange={(e) => setProfileForm({ ...profileForm, billingState: e.target.value })} />
              </label>
              <label className="block">
                <span className="field-label">Postal code</span>
                <input className="field-box" value={profileForm.billingPostalCode} onChange={(e) => setProfileForm({ ...profileForm, billingPostalCode: e.target.value })} />
              </label>
              <label className="block">
                <span className="field-label">Country (ISO2)</span>
                <input className="field-box" maxLength={2} value={profileForm.billingCountry} onChange={(e) => setProfileForm({ ...profileForm, billingCountry: e.target.value.toUpperCase() })} />
              </label>
            </div>
            {error && <Alert>{error}</Alert>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" disabled={busy} onClick={() => setShowProfileModal(false)}>Cancel</Button>
              <Button disabled={busy} onClick={saveProfile}>{busy ? <Loader2 size={14} className="animate-spin" /> : null}Save</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaction history modal */}
      <Modal isOpen={showTransactionsModal} title="Transaction history" onClose={() => setShowTransactionsModal(false)}>
        {!transactions ? (
          <div className="grid min-h-24 place-items-center"><Spinner label="Loading" /></div>
        ) : !transactions.length ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No transactions yet.</p>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl p-3 text-sm" style={{ background: "var(--bg-elev)" }}>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(tx.createdAt)} · {tx.status}</p>
                </div>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>{tx.amountSar} SAR</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
