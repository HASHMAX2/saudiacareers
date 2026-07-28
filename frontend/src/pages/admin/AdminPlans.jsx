import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";

const EMP = "var(--accent)";

export function AdminPlans() {
  const [plans, setPlans] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await adminApi.plans();
    setPlans(data.data);
  }

  useEffect(() => { load(); }, []);

  function openEdit(plan) {
    setEditing(plan);
    setForm({
      name: plan.name,
      priceSar: String(plan.priceSar),
      paidCreditsGranted: String(plan.paidCreditsGranted),
      features: plan.features.join("\n"),
      dodoProductId: plan.dodoProductId ?? "",
    });
    setError("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await adminApi.updatePlan(editing.id, {
        name: form.name.trim(),
        priceSar: Number(form.priceSar),
        paidCreditsGranted: Number(form.paidCreditsGranted),
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
        dodoProductId: form.dodoProductId.trim(),
      });
      setEditing(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to update plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Plans</h1>
      <p className="mt-2 mb-7 text-base" style={{ color: "var(--text-secondary)" }}>
        Pricing and features shown to employers on the Billing page.
      </p>

      {!plans ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading plans" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl p-6" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
              <Badge tone={plan.tier === "FREE" ? "neutral" : "blue"}>{plan.tier}</Badge>
              <p className="mt-3 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{plan.name}</p>
              <p className="mt-1 text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                {plan.priceSar} <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>SAR/mo</span>
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>{plan.paidCreditsGranted} paid credits granted</p>
              {plan.priceSar > 0 && (
                <p className="mt-1 text-xs" style={{ color: plan.dodoProductId ? "var(--green)" : "var(--gold-ink)" }}>
                  {plan.dodoProductId ? `Linked to Dodo product ${plan.dodoProductId}` : "Not linked to a Dodo product yet"}
                </p>
              )}
              <ul className="mt-4 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                    <CheckCircle2 size={15} style={{ color: EMP, marginTop: "2px", flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <Button className="mt-5 w-full" variant="secondary" onClick={() => openEdit(plan)}>Edit plan</Button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!editing} title={`Edit ${editing?.name ?? ""}`} onClose={() => setEditing(null)}>
        {form && (
          <form onSubmit={handleSave} className="space-y-3">
            <Input id="plan-name" label="Plan name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input id="plan-price" label="Price (SAR/month)" type="number" min="0" required value={form.priceSar} onChange={(e) => setForm((f) => ({ ...f, priceSar: e.target.value }))} />
            <Input id="plan-credits" label="Paid credits granted" type="number" min="0" required value={form.paidCreditsGranted} onChange={(e) => setForm((f) => ({ ...f, paidCreditsGranted: e.target.value }))} />
            <label className="block">
              <span className="field-label">Features (one per line)</span>
              <textarea className="field-box min-h-32 resize-y" value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} />
            </label>
            <Input
              id="plan-dodo-product-id"
              label="Dodo product ID"
              value={form.dodoProductId}
              onChange={(e) => setForm((f) => ({ ...f, dodoProductId: e.target.value }))}
              placeholder="pdt_..."
            />
            {error && <Alert>{error}</Alert>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin shrink-0" />Saving…</> : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
