import { useEffect, useState } from "react";
import { Loader2, Receipt, SlidersHorizontal } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Select } from "../../components/common/Select.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const STATUS_TONES = { PENDING: "amber", PAID: "green", FAILED: "red", REFUND_REQUESTED: "blue", REFUNDED: "neutral" };
const STATUS_LABELS = { PENDING: "Pending", PAID: "Paid", FAILED: "Failed", REFUND_REQUESTED: "Refund requested", REFUNDED: "Refunded" };
const TYPE_LABELS = { SUBSCRIPTION: "Plan subscription", CREDIT_PACK: "Job credit pack", REFUND: "Refund" };

export function Invoices() {
  const [invoices, setInvoices] = useState(null);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await adminApi.invoices({ page: 1, limit: 50, ...(status ? { status } : {}) });
    setInvoices(data.data.invoices);
  }

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function approveRefund(id) {
    setBusyId(id);
    setError("");
    try {
      await adminApi.approveRefund(id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to approve refund");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Invoices</h1>
      <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        Payments are confirmed automatically by the payment gateway. Refund requests still need your approval.
      </p>

      <div className="mb-5 flex gap-3">
        <Select
          className="w-48"
          icon={SlidersHorizontal}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "", label: "All statuses" },
            { value: "PENDING", label: "Pending" },
            { value: "PAID", label: "Paid" },
            { value: "FAILED", label: "Failed" },
            { value: "REFUND_REQUESTED", label: "Refund requested" },
            { value: "REFUNDED", label: "Refunded" },
          ]}
        />
      </div>

      {error && <Alert>{error}</Alert>}

      {!invoices ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading invoices" /></div>
      ) : !invoices.length ? (
        <div className="card-soft grid min-h-56 place-items-center p-8 text-center">
          <div>
            <Receipt className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>No invoices found</h2>
          </div>
        </div>
      ) : (
        <div className="card-soft overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead style={{ background: "var(--bg-elev)" }}>
              <tr>
                {["Company", "Type", "Amount", "Date", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-4 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderTop: "1px solid var(--border-default)" }}>
                  <td className="px-5 py-4 font-medium" style={{ color: "var(--text-primary)" }}>{inv.employerProfile.companyName}</td>
                  <td className="px-5 py-4" style={{ color: "var(--text-secondary)" }}>{TYPE_LABELS[inv.type] ?? inv.type}</td>
                  <td className="px-5 py-4 font-semibold" style={{ color: "var(--text-primary)" }}>{inv.amountSar} SAR</td>
                  <td className="px-5 py-4 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(inv.issuedAt)}</td>
                  <td className="px-5 py-4"><Badge tone={STATUS_TONES[inv.status]}>{STATUS_LABELS[inv.status]}</Badge></td>
                  <td className="px-5 py-4 text-right">
                    {inv.status === "REFUND_REQUESTED" && (
                      <Button size="sm" variant="secondary" disabled={busyId === inv.id} onClick={() => approveRefund(inv.id)}>
                        {busyId === inv.id ? <><Loader2 size={13} className="animate-spin shrink-0" />Approving…</> : "Approve refund"}
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
