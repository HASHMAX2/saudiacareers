import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

export function Refunds() {
  const [requests, setRequests] = useState(null);
  const [resolved, setResolved] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState("");

  async function load() {
    const [openRes, resolvedRes] = await Promise.all([
      adminApi.invoices({ status: "REFUND_REQUESTED", page: 1, limit: 50 }),
      adminApi.invoices({ status: "REFUNDED", page: 1, limit: 10 }),
    ]);
    setRequests(openRes.data.data.invoices);
    setResolved(resolvedRes.data.data.invoices);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id) {
    setBusyId(id);
    setError("");
    try {
      await adminApi.markInvoiceRefunded(id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to approve refund");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject() {
    if (!reason.trim()) return;
    setBusyId(rejectTarget.id);
    setError("");
    try {
      await adminApi.rejectInvoiceRefund(rejectTarget.id, reason.trim());
      setRejectTarget(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to reject refund");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Refunds &amp; cancellations</h1>
      <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        Manual review before refund. Every decision is recorded on the invoice.
      </p>

      {error && <Alert>{error}</Alert>}

      <div className="rounded-2xl mb-6" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <div>
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Refund requests</h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>Open requests awaiting a decision.</p>
          </div>
          {requests && <Badge tone="amber">{requests.length} open</Badge>}
        </div>
        {!requests ? (
          <div className="grid min-h-32 place-items-center"><Spinner label="Loading" /></div>
        ) : !requests.length ? (
          <div className="p-8 text-center">
            <RotateCcw className="mx-auto" size={26} style={{ color: "var(--text-tertiary)" }} />
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No open refund requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  {["Employer", "Invoice", "Amount", "Reason", "Requested", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((inv, i) => (
                  <tr key={inv.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none" }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{inv.employerProfile?.companyName}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>INV-{inv.id}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{inv.amountSar} SAR</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{inv.note}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(inv.issuedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" disabled={busyId === inv.id} onClick={() => handleApprove(inv.id)}>Approve</Button>
                        <Button size="sm" variant="danger" disabled={busyId === inv.id} onClick={() => { setReason(""); setRejectTarget(inv); }}>Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
        <div className="p-5" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Recently refunded</h2>
        </div>
        {!resolved ? (
          <div className="grid min-h-32 place-items-center"><Spinner label="Loading" /></div>
        ) : !resolved.length ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Nothing refunded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  {["Employer", "Amount", "Refunded on"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resolved.map((inv, i) => (
                  <tr key={inv.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none" }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{inv.employerProfile?.companyName}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{inv.amountSar} SAR</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(inv.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!rejectTarget} title="Reject refund request" onClose={() => setRejectTarget(null)}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>This reason is recorded on the invoice.</p>
        <label className="mt-3 block">
          <span className="field-label">Reason</span>
          <textarea className="field-box min-h-24 resize-y" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Outside the 7-day refund window" />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button variant="danger" disabled={!reason.trim() || busyId === rejectTarget?.id} onClick={confirmReject}>Confirm rejection</Button>
        </div>
      </Modal>
    </div>
  );
}
