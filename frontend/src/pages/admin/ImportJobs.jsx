import { AlertCircle, Check, ChevronDown, ChevronUp, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Toast } from "../../components/common/Toast.jsx";

const LOCATION_OPTIONS = ["Riyadh", "Jeddah", "Dammam", "Other"];
const INDUSTRY_OPTIONS = ["Education", "Healthcare", "Technology", "Finance", "Engineering", "Retail", "Hospitality", "Construction", "Marketing", "Administration", "Other"];
const EMPLOYMENT_OPTIONS = ["Full-time", "Part-time", "Contract", "Internship"];

const REQUIRED = ["title", "companyName", "location", "industry", "employmentType", "experienceRequired", "description", "requiredSkills", "hrEmail"];

function missingFields(job) {
  return REQUIRED.filter((k) => !job[k]?.trim());
}

function emailValid(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v ?? "").trim());
}

function validateCard(job) {
  const errors = {};
  if (!job.title?.trim()) errors.title = "Required";
  else if (job.title.trim().length < 2) errors.title = "Min 2 chars";
  if (!job.companyName?.trim()) errors.companyName = "Required";
  if (!job.location?.trim()) errors.location = "Required";
  if (!job.industry?.trim()) errors.industry = "Required";
  if (!job.employmentType?.trim()) errors.employmentType = "Required";
  if (!job.experienceRequired?.trim()) errors.experienceRequired = "Required";
  if (!job.description?.trim()) errors.description = "Required";
  else if (job.description.trim().length < 20) errors.description = "Min 20 chars";
  if (!job.requiredSkills?.trim()) errors.requiredSkills = "Required";
  if (!job.hrEmail?.trim()) errors.hrEmail = "Required";
  else if (!emailValid(job.hrEmail)) errors.hrEmail = "Invalid email";
  return errors;
}

// ─── Individual job review card ───────────────────────────────────────────────
function JobReviewCard({ index, total, job, onUpdate, onDiscard }) {
  const [expanded, setExpanded] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [pubError, setPubError] = useState("");
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, text: "" });
  const timerRef = useRef(null);

  const missing = missingFields(job);
  const hasWarnings = missing.length > 0 || !emailValid(job.hrEmail);

  function field(key, value) {
    onUpdate(index, key, value);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handlePublish() {
    const errs = validateCard(job);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setExpanded(true);
      return;
    }
    setErrors({});
    setPubError("");
    setPublishing(true);
    try {
      await adminApi.createJob({
        ...job,
        salaryRange: job.salaryRange || null,
        applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString() : null,
        status: "ACTIVE",
      });
      setPublished(true);
      setExpanded(false);
      setToast({ show: true, text: "Job published!" });
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setToast({ show: false, text: "" }), 2500);
    } catch (err) {
      setPubError(err.response?.data?.message ?? "Failed to publish. Check all fields.");
    } finally {
      setPublishing(false);
    }
  }

  // ── Published state ──────────────────────────────────────────────────────
  if (published) {
    return (
      <div
        className="card-soft flex items-center gap-3 px-5 py-4"
        style={{ borderColor: "#86EFAC", background: "#F0FDF4" }}
      >
        <Toast show={toast.show} message={toast.text} tone="success" duration={2500} />
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
          style={{ background: "#16A34A", color: "#fff" }}
        >
          <Check size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: "#15803D" }}>{job.title}</p>
          <p className="text-sm" style={{ color: "#166534" }}>{job.companyName} · {job.location}</p>
        </div>
        <span className="text-sm font-semibold" style={{ color: "#16A34A" }}>Published</span>
      </div>
    );
  }

  return (
    <div className="card-soft overflow-visible">
      {/* Card header */}
      <div
        className="flex items-start gap-3 px-5 py-4 cursor-pointer"
        style={{ borderBottom: expanded ? "1px solid var(--border-default)" : "none" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span
          className="mt-0.5 shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5"
          style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}
        >
          {index + 1}/{total}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
            {job.title || <span style={{ color: "var(--text-tertiary)" }}>Untitled role</span>}
          </p>
          <p className="mt-0.5 text-sm truncate" style={{ color: "var(--text-secondary)" }}>
            {[job.companyName, job.location, job.employmentType].filter(Boolean).join(" · ")}
          </p>
          {hasWarnings && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium" style={{ color: "#D97706" }}>
              <AlertCircle size={12} />
              {missing.length} field{missing.length !== 1 ? "s" : ""} need attention
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="danger" onClick={onDiscard} disabled={publishing}>
            <Trash2 size={13} />
          </Button>
          <button
            className="rounded-full p-1.5 transition-colors hover:bg-black/5"
            style={{ color: "var(--text-tertiary)" }}
            onClick={() => setExpanded((v) => !v)}
            type="button"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-5 pb-5 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Job title" required error={errors.title}>
              <input
                className={`form-control ${errors.title ? "border-red-400" : ""}`}
                value={job.title ?? ""}
                onChange={(e) => field("title", e.target.value)}
                placeholder="e.g. English Teacher"
              />
            </FormField>
            <FormField label="Company name" required error={errors.companyName}>
              <input
                className={`form-control ${errors.companyName ? "border-red-400" : ""}`}
                value={job.companyName ?? ""}
                onChange={(e) => field("companyName", e.target.value)}
                placeholder="e.g. Najd Schools"
              />
            </FormField>

            <FormField label="Location" required error={errors.location}>
              <select
                className={`form-control appearance-none ${errors.location ? "border-red-400" : ""}`}
                value={job.location ?? ""}
                onChange={(e) => field("location", e.target.value)}
              >
                <option value="">Select…</option>
                {LOCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </FormField>
            <FormField label="Industry" required error={errors.industry}>
              <select
                className={`form-control appearance-none ${errors.industry ? "border-red-400" : ""}`}
                value={job.industry ?? ""}
                onChange={(e) => field("industry", e.target.value)}
              >
                <option value="">Select…</option>
                {INDUSTRY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </FormField>

            <FormField label="Employment type" required error={errors.employmentType}>
              <select
                className={`form-control appearance-none ${errors.employmentType ? "border-red-400" : ""}`}
                value={job.employmentType ?? ""}
                onChange={(e) => field("employmentType", e.target.value)}
              >
                <option value="">Select…</option>
                {EMPLOYMENT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </FormField>
            <FormField label="Experience required" required error={errors.experienceRequired}>
              <input
                className={`form-control ${errors.experienceRequired ? "border-red-400" : ""}`}
                value={job.experienceRequired ?? ""}
                onChange={(e) => field("experienceRequired", e.target.value)}
                placeholder="e.g. 2+ years"
              />
            </FormField>

            <FormField label="Salary range (optional)">
              <input
                className="form-control"
                value={job.salaryRange ?? ""}
                onChange={(e) => field("salaryRange", e.target.value)}
                placeholder="e.g. SAR 8,000–12,000/month"
              />
            </FormField>
            <FormField label="Application deadline (optional)">
              <input
                type="date"
                className="form-control"
                value={job.applicationDeadline?.slice?.(0, 10) ?? ""}
                onChange={(e) => field("applicationDeadline", e.target.value)}
              />
            </FormField>

            <FormField label="Required skills" required error={errors.requiredSkills} className="md:col-span-2">
              <input
                className={`form-control ${errors.requiredSkills ? "border-red-400" : ""}`}
                value={job.requiredSkills ?? ""}
                onChange={(e) => field("requiredSkills", e.target.value)}
                placeholder="Comma-separated, e.g. English, Teaching, Communication"
              />
            </FormField>
            <FormField label="HR application email" required error={errors.hrEmail} className="md:col-span-2">
              <input
                type="email"
                className={`form-control ${errors.hrEmail ? "border-red-400" : ""}`}
                value={job.hrEmail ?? ""}
                onChange={(e) => field("hrEmail", e.target.value)}
                placeholder="hr@company.com"
              />
            </FormField>
            <FormField label="Job description" required error={errors.description} className="md:col-span-2">
              <textarea
                className={`form-control min-h-32 resize-y ${errors.description ? "border-red-400" : ""}`}
                value={job.description ?? ""}
                onChange={(e) => field("description", e.target.value)}
                placeholder="Role summary and requirements…"
              />
            </FormField>
          </div>

          {pubError && <div className="mt-4 alert-error">{pubError}</div>}

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="secondary" onClick={onDiscard} disabled={publishing}>
              Discard
            </Button>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing
                ? <><Loader2 size={14} className="animate-spin" />Publishing…</>
                : <><Upload size={14} />Publish job</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, required, error, children, className = "" }) {
  return (
    <label className={className}>
      <span className="field-label">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function ImportJobs() {
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [jobs, setJobs] = useState(null);
  const [publishAllBusy, setPublishAllBusy] = useState(false);
  const [publishAllToast, setPublishAllToast] = useState({ show: false, text: "" });
  const toastTimer = useRef(null);

  function updateJob(index, key, value) {
    setJobs((prev) => prev.map((j, i) => (i === index ? { ...j, [key]: value } : j)));
  }

  function discardJob(index) {
    setJobs((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleParse() {
    if (!rawText.trim()) return;
    setParsing(true);
    setParseError("");
    setJobs(null);
    try {
      const { data } = await adminApi.parseImport(rawText);
      setJobs(data.data.jobs);
    } catch (err) {
      setParseError(err.response?.data?.message ?? "Parsing failed — please try again.");
    } finally {
      setParsing(false);
    }
  }

  async function handlePublishAll() {
    if (!jobs?.length) return;
    setPublishAllBusy(true);
    // Trigger publish on each card individually via the ref approach isn't clean,
    // so we do a direct batch publish of all valid pending jobs
    const results = await Promise.allSettled(
      jobs.map((job) => {
        const errs = validateCard(job);
        if (Object.keys(errs).length) return Promise.reject(new Error("Validation failed"));
        return adminApi.createJob({
          ...job,
          salaryRange: job.salaryRange || null,
          applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString() : null,
          status: "ACTIVE",
        });
      })
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;
    setPublishAllBusy(false);

    const text = failed === 0
      ? `All ${succeeded} job${succeeded !== 1 ? "s" : ""} published!`
      : `${succeeded} published, ${failed} failed (check individual cards).`;

    setPublishAllToast({ show: true, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setPublishAllToast({ show: false, text: "" }), 3000);

    if (succeeded > 0) {
      // Mark succeeded jobs as published by removing them from the list after a short delay
      setJobs((prev) =>
        prev.map((job, i) =>
          results[i].status === "fulfilled" ? { ...job, _published: true } : job
        )
      );
    }
  }

  const pendingCount = jobs?.filter((j) => !j._published).length ?? 0;

  return (
    <div>
      <Toast show={publishAllToast.show} message={publishAllToast.text} tone="success" duration={3000} />

      <div className="mb-6">
        <p className="section-label">Admin</p>
        <h1 className="page-title text-3xl md:text-4xl">Import jobs</h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          Paste WhatsApp job messages below. AI will extract each role into a pre-filled form for you to review and publish.
        </p>
      </div>

      {/* Input area */}
      <div className="card-soft p-5 sm:p-6">
        <label className="field-label" htmlFor="whatsapp-paste">
          WhatsApp messages <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id="whatsapp-paste"
          className="form-control min-h-56 resize-y font-mono text-sm"
          placeholder={"Paste one or more WhatsApp job messages here…\n\nExample:\n[12:30] Afnan: 📢 Job Opportunity\n📍 Riyadh\n🏢 Acme Corp\n➡️ Software Engineer\n✅ Requirements:\n• 3+ years experience\n📩 Apply: hr@acme.com"}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={parsing}
        />
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {rawText.length.toLocaleString()} characters · Multiple messages supported · Multiple roles per message OK
          </p>
          <Button onClick={handleParse} disabled={parsing || !rawText.trim()}>
            {parsing
              ? <><Loader2 size={14} className="animate-spin" />Parsing with AI…</>
              : <><Sparkles size={14} />Parse jobs</>}
          </Button>
        </div>
        {parseError && <div className="mt-4 alert-error">{parseError}</div>}
      </div>

      {/* Results */}
      {jobs !== null && (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                Review each role, fix any flagged fields, then publish individually or all at once.
              </p>
            </div>
            {pendingCount > 1 && (
              <Button onClick={handlePublishAll} disabled={publishAllBusy}>
                {publishAllBusy
                  ? <><Loader2 size={14} className="animate-spin" />Publishing all…</>
                  : <><Upload size={14} />Publish all ({pendingCount})</>}
              </Button>
            )}
          </div>

          {jobs.length === 0 ? (
            <Alert>No jobs were extracted from the messages. Check that the text contains job postings and try again.</Alert>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <JobReviewCard
                  key={i}
                  index={i}
                  total={jobs.length}
                  job={job}
                  onUpdate={updateJob}
                  onDiscard={() => discardJob(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
