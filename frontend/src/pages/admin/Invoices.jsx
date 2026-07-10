import { useEffect, useState } from "react";
import { Receipt, SlidersHorizontal } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
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
  const [failTarget, setFailTarget] = useState(null);
  const [reason, setReason] = useState("");

  async function load() {
    const { data } = await adminApi.invoices({ page: 1, limit: 50, ...(status ? { status } : {}) });
    setInvoices(data.data.invoices);
  }

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markPaid(id) {
    setBusyId(id);
    setError("");
    try {
      await adminApi.markInvoicePaid(id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to mark paid");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmMarkFailed() {
    if (!reason.trim()) return;
    setBusyId(failTarget.id);
    setError("");
    try {
      await adminApi.markInvoiceFailed(failTarget.id, reason.trim());
      setFailTarget(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to mark failed");
    } finally {
      setBusyId(null);
    }
  }

  async function markRefunded(id) {
    setBusyId(id);
    setError("");
    try {
      await adminApi.markInvoiceRefunded(id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to mark refunded");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Invoices</h1>
      <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        Confirm employer plan/credit payments and process refund requests.
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
                    {inv.status === "PENDING" && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button size="sm" disabled={busyId === inv.id} onClick={() => markPaid(inv.id)}>Mark paid</Button>
                        <Button size="sm" variant="danger" disabled={busyId === inv.id} onClick={() => { setReason(""); setFailTarget(inv); }}>Mark failed</Button>
                      </div>
                    )}
                    {inv.status === "REFUND_REQUESTED" && (
                      <Button size="sm" variant="secondary" disabled={busyId === inv.id} onClick={() => markRefunded(inv.id)}>Mark refunded</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!failTarget} title="Mark payment failed" onClose={() => setFailTarget(null)}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>This reason is recorded on the invoice and sent to the employer.</p>
        <label className="mt-3 block">
          <span className="field-label">Reason</span>
          <textarea className="field-box min-h-24 resize-y" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Bank transfer did not arrive" />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setFailTarget(null)}>Cancel</Button>
          <Button variant="danger" disabled={!reason.trim() || busyId === failTarget?.id} onClick={confirmMarkFailed}>Confirm failed</Button>
        </div>
      </Modal>
    </div>
  );
}
