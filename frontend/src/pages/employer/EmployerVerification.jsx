import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, FileWarning, Loader2, XCircle } from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";

const EMP = "var(--accent)";

const STATUS_META = {
  PENDING: { tone: "amber", label: "Pending review", icon: Clock },
  APPROVED: { tone: "green", label: "Verified", icon: CheckCircle2 },
  REJECTED: { tone: "red", label: "Rejected", icon: XCircle },
};

export function EmployerVerification() {
  const [status, setStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef(null);

  async function load() {
    const [verRes, profRes] = await Promise.all([employerApi.getVerification(), employerApi.getProfile()]);
    setStatus(verRes.data.data);
    setProfile(profRes.data.data);
    setForm({
      companyName: profRes.data.data.companyName ?? "",
      website: profRes.data.data.website ?? "",
      linkedinUrl: profRes.data.data.linkedinUrl ?? "",
      industry: profRes.data.data.industry ?? "",
      description: profRes.data.data.description ?? "",
      taxRegistrationNumber: profRes.data.data.taxRegistrationNumber ?? "",
    });
  }

  useEffect(() => { load(); }, []);

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await employerApi.updateProfile(form);
      setNotice("Company profile updated");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to save company profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const { data } = await employerApi.submitVerificationDoc(file);
      setNotice(data.message);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to upload document");
    } finally {
      setUploading(false);
    }
  }

  if (!status || !profile || !form) {
    return <div className="grid min-h-64 place-items-center"><Spinner label="Loading verification status" /></div>;
  }

  const meta = STATUS_META[status.verificationStatus] ?? STATUS_META.PENDING;
  const Icon = meta.icon;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>Company Profile</h1>
      <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        Manage company details used for verification and shown on your public job posts.
      </p>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.8fr]">
        <div className="rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <form onSubmit={handleSaveProfile}>
            <div className="p-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Company information</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input id="ver-companyName" label="Company name" required value={form.companyName} onChange={update("companyName")} />
                <Input id="ver-website" label="Website" value={form.website} onChange={update("website")} placeholder="https://" />
                <Input id="ver-linkedin" label="LinkedIn company page" value={form.linkedinUrl} onChange={update("linkedinUrl")} placeholder="https://linkedin.com/company/..." />
                <Input id="ver-industry" label="Industry" value={form.industry} onChange={update("industry")} />
                <Input id="ver-tax" label="Tax / CR registration number" value={form.taxRegistrationNumber} onChange={update("taxRegistrationNumber")} />
                <div className="md:col-span-2">
                  <label className="block">
                    <span className="field-label">About company</span>
                    <textarea className="field-box min-h-28 resize-y" value={form.description} onChange={update("description")} />
                  </label>
                </div>
              </div>
              <Button className="mt-4" disabled={saving} type="submit" style={{ background: EMP, borderColor: EMP }}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>

            <div className="p-6">
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Verification document</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {status.hasDocument ? "Document submitted — you can resubmit if it was rejected." : "Upload a company registration document (PDF, JPEG, or PNG)."}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="field-box flex-1"
                />
                <Button type="button" disabled={!file || uploading} onClick={handleUpload} style={{ background: EMP, borderColor: EMP }}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileWarning size={14} />}
                  {status.hasDocument ? "Resubmit document" : "Submit document"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="rounded-2xl p-6" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}>
              <Icon size={19} />
            </span>
            <div>
              <p className="font-bold" style={{ color: "var(--text-primary)" }}>{profile.companyName}</p>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>
          </div>

          {status.verificationStatus !== "APPROVED" && status.verificationNote && (
            <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              <strong>{status.verificationStatus === "PENDING" ? "Admin requested:" : "Reviewer note:"}</strong> {status.verificationNote}
            </p>
          )}

          <h4 className="mt-5 mb-2.5 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Verification status</h4>
          <div className="space-y-2.5">
            <ChecklistItem label="Company profile" done={!!profile.companyName} value={profile.companyName ? "Complete" : "Missing"} />
            <ChecklistItem label="Verification document" done={status.hasDocument} value={status.hasDocument ? "Submitted" : "Missing"} />
            <ChecklistItem label="Admin review" done={status.verificationStatus === "APPROVED"} value={meta.label} />
          </div>

          {status.verificationStatus !== "APPROVED" && (
            <div className="mt-5 rounded-xl p-4 text-sm" style={{ background: "var(--gold-bg)", color: "#8A5D10" }}>
              Publishing jobs will unlock once verification is approved. Most reviews complete within 24 hours.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ label, done, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm" style={{ background: "var(--bg-elev)" }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="font-semibold" style={{ color: done ? "var(--green)" : "var(--text-tertiary)" }}>{value}</span>
    </div>
  );
}
