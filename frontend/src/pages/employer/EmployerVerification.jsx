import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Building2, Camera, CheckCircle2, Clock, FileText, Loader2, ShieldCheck, Trash2, Upload, XCircle,
} from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { useAuthStore } from "../../store/authStore.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Select } from "../../components/common/Select.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { Toast } from "../../components/common/Toast.jsx";
import {
  MAX_VERIFICATION_DOC_SIZE_BYTES, SUPPORT_REQUEST_CATEGORIES, VERIFICATION_DOCUMENT_TYPES, VERIFICATION_DOC_MIME_TYPES,
} from "../../utils/constants.js";

const EMP = "var(--accent)";

const STATUS_META = {
  PENDING: { tone: "amber", label: "Pending review", icon: Clock },
  APPROVED: { tone: "green", label: "Verified", icon: CheckCircle2 },
  REJECTED: { tone: "red", label: "Rejected", icon: XCircle },
};

const EMPTY_SUPPORT_FORM = { category: "VERIFICATION", subject: "", message: "" };
const TOAST_DURATION = 3000;

function companyInitials(name) {
  return (name ?? "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function documentLabel(value) {
  return VERIFICATION_DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EmployerVerification() {
  const userEmail = useAuthStore((state) => state.user?.email);
  const [status, setStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  function flashToast(message) {
    clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), TOAST_DURATION);
  }

  // Add-document flow
  const [docType, setDocType] = useState("");
  const [docFieldErrors, setDocFieldErrors] = useState({});
  const [addingDoc, setAddingDoc] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [declared, setDeclared] = useState(false);
  const fileInputRef = useRef(null);

  // Contact support
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportForm, setSupportForm] = useState(EMPTY_SUPPORT_FORM);
  const [supportFieldErrors, setSupportFieldErrors] = useState({});
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [supportSuccess, setSupportSuccess] = useState(false);

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

  async function refreshVerification() {
    const { data } = await employerApi.getVerification();
    setStatus(data.data);
  }

  useEffect(() => { load(); }, []);

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await employerApi.updateProfile(form);
      // Reload first so the confirmation only appears once the page is
      // actually showing the saved data, not a moment before it.
      await load();
      flashToast("Your company profile has been updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to save company profile");
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError("");
    try {
      await employerApi.uploadLogo(file);
      await load();
      flashToast("Company logo updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Logo upload failed");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  }

  // Selecting a file uploads it immediately — no separate "Add" step. If a
  // document of this type already exists, the backend replaces it in place.
  async function handleFileSelected(e) {
    const file = e.target.files?.[0] ?? null;
    setDocFieldErrors((p) => ({ ...p, docFile: undefined }));
    if (!file) return;

    const errors = {};
    if (!docType) errors.docType = "Select a document type first.";
    else if (!VERIFICATION_DOC_MIME_TYPES.includes(file.type)) errors.docFile = "Only PDF files are accepted.";
    else if (file.size > MAX_VERIFICATION_DOC_SIZE_BYTES) errors.docFile = "File must be 5 MB or smaller.";

    if (Object.keys(errors).length > 0) {
      setDocFieldErrors(errors);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setDocFieldErrors({});
    setError("");
    setAddingDoc(true);
    try {
      await employerApi.uploadVerificationDoc(docType, file);
      // Refresh first so the new document is already showing in the list
      // by the time the type/file fields clear — otherwise the form goes
      // blank for a beat before anything appears, which reads as broken.
      await refreshVerification();
      setDocType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to add document");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setAddingDoc(false);
    }
  }

  async function handleRemoveDocument(id) {
    setRemovingId(id);
    setError("");
    try {
      await employerApi.deleteVerificationDoc(id);
      await refreshVerification();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to remove document");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleSubmitVerification() {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await employerApi.submitVerification();
      // Refresh first — once the status flips to "awaiting review" the
      // checklist/checkbox unmount entirely, so there's no visible moment
      // where the box is on screen but unchecked before submission lands.
      await refreshVerification();
      setDeclared(false);
      flashToast(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to submit for verification");
    } finally {
      setSubmitting(false);
    }
  }

  function openSupport() {
    setSupportForm(EMPTY_SUPPORT_FORM);
    setSupportFieldErrors({});
    setSupportError("");
    setSupportSuccess(false);
    setSupportOpen(true);
  }

  function updateSupport(key) {
    return (e) => {
      setSupportForm((f) => ({ ...f, [key]: e.target.value }));
      setSupportFieldErrors((p) => ({ ...p, [key]: undefined }));
    };
  }

  function validateSupport(f) {
    const errors = {};
    if (!f.subject.trim() || f.subject.trim().length < 3) errors.subject = "Subject must be at least 3 characters.";
    if (!f.message.trim() || f.message.trim().length < 10) errors.message = "Please describe the issue in at least 10 characters.";
    return errors;
  }

  async function handleSupportSubmit(e) {
    e.preventDefault();
    const errors = validateSupport(supportForm);
    if (Object.keys(errors).length > 0) { setSupportFieldErrors(errors); return; }
    setSupportFieldErrors({});
    setSupportError("");
    setSupportSubmitting(true);
    try {
      await employerApi.submitSupportRequest(supportForm);
      setSupportSuccess(true);
    } catch (requestError) {
      setSupportError(requestError.response?.data?.message ?? "Unable to send your support request");
    } finally {
      setSupportSubmitting(false);
    }
  }

  if (!status || !profile || !form) {
    return <div className="grid min-h-64 place-items-center"><Spinner label="Loading verification status" /></div>;
  }

  const meta = STATUS_META[status.verificationStatus] ?? STATUS_META.PENDING;
  const Icon = meta.icon;
  const isApproved = status.verificationStatus === "APPROVED";
  // PENDING covers two very different states: a fresh account that has never
  // submitted anything, and one that already submitted and is awaiting an
  // admin decision. Only the latter should lock the form — otherwise the
  // add/remove/submit controls stay fully interactive even after submission,
  // which is what let documents keep changing under an already-pending review.
  const awaitingReview = status.verificationStatus === "PENDING" && !!status.verificationSubmittedAt;
  const locked = isApproved || awaitingReview;

  return (
    <div className="w-full lg:w-[85%]">
      <Toast show={toastVisible} message={toastMessage} tone="success" duration={TOAST_DURATION} />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>Company Profile</h1>
        <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
          Manage company details and submit documents for employer verification.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.8fr]">
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
            <form onSubmit={handleSaveProfile}>
              <div className="p-6">
                <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Company information</h3>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative shrink-0">
                    {profile.logoUrl ? (
                      <img
                        src={profile.logoUrl}
                        alt={profile.companyName}
                        className="h-16 w-16 rounded-xl object-cover"
                        style={{ border: "1px solid var(--border-default)" }}
                      />
                    ) : (
                      <div
                        className="grid h-16 w-16 place-items-center rounded-xl font-bold"
                        style={{ background: "var(--accent-subtle)", color: EMP, border: "1px solid var(--border-default)" }}
                      >
                        {profile.companyName ? companyInitials(profile.companyName) : <Building2 size={22} />}
                      </div>
                    )}
                    <label
                      className="absolute grid cursor-pointer place-items-center rounded-full"
                      style={{ width: 26, height: 26, bottom: -4, right: -4, background: EMP, color: "#fff" }}
                      title="Change company logo"
                    >
                      {logoUploading
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Camera size={12} />}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={logoUploading} onChange={uploadLogo} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Company logo</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>JPEG, PNG, or WebP. Max 2 MB.</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                  {saving ? <><Loader2 size={14} className="animate-spin shrink-0" />Saving…</> : "Save changes"}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
            <div className="p-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Verification documents</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {isApproved
                  ? "Your company is verified — no further documents are required."
                  : awaitingReview
                    ? "Your documents have been submitted and are locked while our team reviews them."
                    : "Add each required document (PDF only, max 5 MB) and submit the full set for review."}
              </p>
            </div>

            {!locked && (
              <div className="p-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    id="ver-docType"
                    label="Document type"
                    required
                    value={docType}
                    onChange={(e) => { setDocType(e.target.value); setDocFieldErrors((p) => ({ ...p, docType: undefined })); }}
                    options={VERIFICATION_DOCUMENT_TYPES}
                    error={docFieldErrors.docType}
                    placeholder="Select a document type"
                  />
                  <div>
                    <label className="block" htmlFor="ver-docFile">
                      <span className="field-label">File (PDF, max 5 MB) <span className="ml-0.5 text-red-500" aria-hidden="true">*</span></span>
                      <input
                        ref={fileInputRef}
                        id="ver-docFile"
                        type="file"
                        accept="application/pdf,.pdf"
                        disabled={addingDoc}
                        onChange={handleFileSelected}
                        className="field-box"
                      />
                    </label>
                    {docFieldErrors.docFile && <span className="mt-1 block text-xs text-red-600">{docFieldErrors.docFile}</span>}
                  </div>
                </div>
                {addingDoc && (
                  <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Loader2 size={14} className="animate-spin" />Uploading…
                  </p>
                )}
              </div>
            )}

            <div className="p-6">
              {status.documents.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-center text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                  No documents added yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {status.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border-default)" }}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: "var(--green-bg)", color: "var(--green)" }}>
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <a href={doc.viewUrl} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold hover:underline" style={{ color: "var(--text-primary)" }} title={documentLabel(doc.documentType)}>
                          {documentLabel(doc.documentType)}
                        </a>
                        <p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{doc.fileName} · {formatBytes(doc.fileSize)}</p>
                      </div>
                      {!locked && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          disabled={removingId === doc.id}
                          className="shrink-0 rounded-lg p-2 hover:bg-red-50"
                          style={{ color: "var(--text-tertiary)" }}
                          aria-label="Remove document"
                        >
                          {removingId === doc.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {awaitingReview && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl p-3.5" style={{ background: "var(--bg-elev)", color: "var(--text-secondary)" }}>
                  <Clock size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <p className="text-sm leading-relaxed">
                    Submitted {status.verificationSubmittedAt ? new Date(status.verificationSubmittedAt).toLocaleDateString() : ""} — you&apos;ll be notified once it&apos;s reviewed. Contact support if you need to change something before then.
                  </p>
                </div>
              )}

              {!locked && !awaitingReview && (
                <>
                  <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={declared}
                      onChange={(e) => setDeclared(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded"
                      style={{ accentColor: EMP }}
                    />
                    <span style={{ color: "var(--text-secondary)" }}>
                      I confirm that these documents are genuine, valid and submitted with authority from the company.
                    </span>
                  </label>
                  <Button
                    type="button"
                    className="mt-4"
                    disabled={submitting || !declared || status.documents.length === 0}
                    onClick={handleSubmitVerification}
                    style={{ background: EMP, borderColor: EMP }}
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Submit for verification
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
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
              <div
                className="mt-4 flex items-start gap-2.5 rounded-xl p-3.5"
                style={{ background: "var(--gold-bg)", border: "1px solid #F0D697" }}
              >
                <AlertTriangle size={17} className="mt-0.5 shrink-0" style={{ color: "#8A5D10" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#8A5D10" }}>
                  <strong>{status.verificationStatus === "PENDING" ? "Admin requested:" : "Reviewer note:"}</strong> {status.verificationNote}
                </p>
              </div>
            )}

            <h4 className="mt-5 mb-2.5 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Verification status</h4>
            <div className="space-y-2.5">
              <ChecklistItem label="Company profile" done={!!profile.companyName} value={profile.companyName ? "Complete" : "Missing"} />
              <ChecklistItem label="Verification documents" done={status.documents.length > 0} value={status.documents.length > 0 ? `${status.documents.length} added` : "Missing"} />
              <ChecklistItem label="Admin review" done={status.verificationStatus === "APPROVED"} value={meta.label} />
            </div>

            {status.verificationStatus !== "APPROVED" && (
              <div className="mt-5 rounded-xl p-4 text-sm" style={{ background: "var(--gold-bg)", color: "#8A5D10" }}>
                Publishing jobs will unlock once verification is approved. Most reviews complete within 24 hours.
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} style={{ color: "var(--text-tertiary)" }} />
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Need help with verification?</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Send your verification problem directly to our team and we&apos;ll follow up by email.
            </p>
            <Button variant="secondary" className="mt-3 w-full" onClick={openSupport}>Contact support</Button>
          </div>
        </div>
      </div>

      <Modal isOpen={supportOpen} title="Contact employer support" onClose={() => setSupportOpen(false)}>
        {supportSuccess ? (
          <div className="py-4 text-center">
            <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--green-bg)" }}>
              <CheckCircle2 size={26} style={{ color: "var(--green)" }} />
            </span>
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Your request has been sent</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Our team has been notified and will follow up at <strong>{userEmail}</strong> shortly.
            </p>
            <Button className="mt-4" onClick={() => setSupportOpen(false)} style={{ background: EMP, borderColor: EMP }}>Done</Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSupportSubmit}>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Your company name, account email, and verification status are included automatically.
            </p>
            <Select
              id="support-category"
              label="Category"
              required
              value={supportForm.category}
              onChange={updateSupport("category")}
              options={SUPPORT_REQUEST_CATEGORIES}
            />
            <Input
              id="support-subject"
              label="Subject"
              required
              maxLength={120}
              value={supportForm.subject}
              onChange={updateSupport("subject")}
              error={supportFieldErrors.subject}
            />
            <div>
              <label className="block" htmlFor="support-message">
                <span className="field-label">Describe the issue <span className="ml-0.5 text-red-500" aria-hidden="true">*</span></span>
                <textarea
                  id="support-message"
                  className="field-box min-h-28 resize-y"
                  placeholder="Explain which document or verification step you need help with."
                  value={supportForm.message}
                  onChange={updateSupport("message")}
                />
              </label>
              {supportFieldErrors.message && <span className="mt-1 block text-xs text-red-600">{supportFieldErrors.message}</span>}
            </div>

            {supportError && <Alert>{supportError}</Alert>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setSupportOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={supportSubmitting} style={{ background: EMP, borderColor: EMP }}>
                {supportSubmitting ? <><Loader2 size={14} className="animate-spin shrink-0" />Sending…</> : "Submit support request"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
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
