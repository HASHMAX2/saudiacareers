import { AlertCircle, Ban, Check, CheckCircle2, ChevronDown, ChevronUp, FileSpreadsheet, Loader2, Sparkles, Trash2, Upload, X, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { JobForm } from "../../components/admin/JobForm.jsx";

// Snapshot of what the AI extraction itself was missing or unsure about, taken
// once at parse time. This is a pre-review hint, not a live validity check —
// JobForm owns moment-to-moment field validation once a card is expanded.
const REQUIRED = ["title", "companyName", "location", "industry", "employmentType", "experienceRequired", "description", "requiredSkills", "hrEmail"];

function missingFields(job) {
  return REQUIRED.filter((k) => !job[k]?.trim());
}

// ─── Individual job review card ───────────────────────────────────────────────
function JobReviewCard({ formRef, index, total, job, expanded, onToggleExpand, published, onPublished, onDiscard }) {
  const missing = missingFields(job);
  const hasWarnings = !published && missing.length > 0;

  async function handleSubmit(payload) {
    await adminApi.createJob(payload);
    onPublished();
  }

  // ── Published state ──────────────────────────────────────────────────────
  if (published) {
    return (
      <div
        className="card-soft flex items-center gap-3 px-5 py-4"
        style={{ borderColor: "#86EFAC", background: "#F0FDF4" }}
      >
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
        onClick={onToggleExpand}
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
              AI extraction flagged {missing.length} field{missing.length !== 1 ? "s" : ""} for review
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="danger" onClick={onDiscard}>
            <Trash2 size={13} />
          </Button>
          <button
            className="rounded-full p-1.5 transition-colors hover:bg-black/5"
            style={{ color: "var(--text-tertiary)" }}
            onClick={onToggleExpand}
            type="button"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded form — the same JobForm used by the manual "Create job" page,
          so imported jobs get the exact same field set, dropdowns (Industry,
          Experience level), and company-email validation. */}
      {expanded && (
        <div className="px-5 pb-5 pt-4">
          <JobForm ref={formRef} initialValue={job} onSubmit={handleSubmit} submitLabel="Publish job" />
        </div>
      )}
    </div>
  );
}

// ─── Persistent (dismissible) publish-all summary — replaces the old 3s toast ──
function PublishSummary({ summary, onDismiss }) {
  if (!summary) return null;
  const { total, succeeded, failed } = summary;
  const allGood = failed === 0;
  return (
    <div
      className="mb-5 flex items-start gap-3 rounded-2xl p-4"
      style={{
        background: allGood ? "#F0FDF4" : "#FFFBEB",
        border: `1px solid ${allGood ? "#86EFAC" : "#FCD34D"}`,
      }}
    >
      {allGood
        ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: "#16A34A" }} />
        : <XCircle size={18} className="mt-0.5 shrink-0" style={{ color: "#D97706" }} />}
      <div className="flex-1 text-sm">
        <p className="font-semibold" style={{ color: allGood ? "#15803D" : "#92400E" }}>
          Publish all: {succeeded} of {total} job{total !== 1 ? "s" : ""} published
        </p>
        {!allGood && (
          <p className="mt-0.5" style={{ color: "#92400E" }}>
            {failed} failed and {failed !== 1 ? "have" : "has"} been expanded below with the exact reason —
            fix and use each card&apos;s own &quot;Publish job&quot; button to retry.
          </p>
        )}
      </div>
      <button type="button" onClick={onDismiss} className="shrink-0 rounded-full p-1 hover:bg-black/5" style={{ color: "var(--text-tertiary)" }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
const IMPORT_MODES = [
  { value: "ai", label: "AI (WhatsApp text)", icon: Sparkles },
  { value: "excel", label: "Excel (.xlsx)", icon: FileSpreadsheet },
];

export function ImportJobs() {
  const [mode, setMode] = useState("ai");
  const [rawText, setRawText] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [jobs, setJobs] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [publishedKeys, setPublishedKeys] = useState(new Set());
  const [publishAllBusy, setPublishAllBusy] = useState(false);
  const [publishSummary, setPublishSummary] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const formRefs = useRef(new Map());
  const excelInputRef = useRef(null);
  const abortRef = useRef(null);

  function discardJob(key) {
    setJobs((prev) => prev.filter((j) => j._key !== key));
    formRefs.current.delete(key);
  }

  function switchMode(next) {
    setMode(next);
    setParseError("");
  }

  function applyParsedJobs(parsedJobs) {
    const withKeys = parsedJobs.map((job, i) => ({ ...job, _key: `job-${Date.now()}-${i}` }));
    setJobs(withKeys);
    setExpandedKeys(new Set(withKeys.map((j) => j._key)));
    setPublishedKeys(new Set());
  }

  // Aborts whichever parse request is currently in flight (AI or Excel) —
  // ERR_CANCELED is the expected outcome of that abort, not a real failure,
  // so it's swallowed instead of surfacing as a parse error.
  function handleCancelParse() {
    abortRef.current?.abort();
  }

  async function handleParseAI() {
    if (!rawText.trim()) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setParsing(true);
    setParseError("");
    setJobs(null);
    setPublishSummary(null);
    formRefs.current.clear();
    try {
      const { data } = await adminApi.parseImport(rawText, controller.signal);
      applyParsedJobs(data.data.jobs);
    } catch (err) {
      if (err.code !== "ERR_CANCELED") {
        setParseError(err.response?.data?.message ?? "Parsing failed — please try again.");
      }
    } finally {
      setParsing(false);
    }
  }

  async function handleParseExcel() {
    if (!excelFile) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setParsing(true);
    setParseError("");
    setJobs(null);
    setPublishSummary(null);
    formRefs.current.clear();
    try {
      const { data } = await adminApi.parseImportExcel(excelFile, controller.signal);
      applyParsedJobs(data.data.jobs);
    } catch (err) {
      if (err.code !== "ERR_CANCELED") {
        setParseError(err.response?.data?.message ?? "Unable to read the spreadsheet — please check the file and try again.");
      }
    } finally {
      setParsing(false);
    }
  }

  // Discards the whole reviewed-but-unpublished batch and returns to the
  // input step. Already-published jobs are real DB rows by this point, so
  // this only ever un-does the review UI's local state, not those creates.
  function handleCancelImport() {
    setJobs(null);
    setExpandedKeys(new Set());
    setPublishedKeys(new Set());
    setPublishSummary(null);
    setParseError("");
    setRawText("");
    setExcelFile(null);
    formRefs.current.clear();
    setShowCancelConfirm(false);
  }

  async function handlePublishAll() {
    const pending = jobs.filter((j) => !publishedKeys.has(j._key));
    if (!pending.length) return;
    setPublishAllBusy(true);
    setPublishSummary(null);

    const results = await Promise.allSettled(
      pending.map((job) => formRefs.current.get(job._key)?.publish() ?? Promise.resolve(false)),
    );

    // Each result is the boolean JobForm.publish() resolved with — true means
    // that card's own onSubmit already fired onPublished() during the call, so
    // publishedKeys is already up to date by the time we get here.
    const failedKeys = pending
      .filter((_, i) => results[i].status !== "fulfilled" || results[i].value !== true)
      .map((j) => j._key);

    setExpandedKeys((prev) => new Set([...prev, ...failedKeys]));
    setPublishAllBusy(false);
    setPublishSummary({ total: pending.length, succeeded: pending.length - failedKeys.length, failed: failedKeys.length });
  }

  const pendingCount = jobs?.filter((j) => !publishedKeys.has(j._key)).length ?? 0;

  return (
    <div>
      <div className="mb-6">
        <p className="section-label">Admin</p>
        <h1 className="page-title text-3xl md:text-4xl">Import jobs</h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          {mode === "ai"
            ? "Paste WhatsApp job messages below. AI will extract each role into a pre-filled form for you to review and publish."
            : "Upload a spreadsheet of job listings. Each row becomes a pre-filled form for you to review and publish."}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="mb-5 inline-flex gap-1 rounded-full p-1" style={{ background: "var(--bg-elev)", border: "1px solid var(--border-default)" }}>
        {IMPORT_MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => switchMode(value)}
            disabled={parsing}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: mode === value ? "var(--accent)" : "transparent",
              color: mode === value ? "#fff" : "var(--text-secondary)",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="card-soft p-5 sm:p-6">
        {mode === "ai" ? (
          <>
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
              <div className="flex items-center gap-2">
                {parsing && (
                  <Button variant="secondary" onClick={handleCancelParse}>
                    <Ban size={14} />Cancel
                  </Button>
                )}
                <Button onClick={handleParseAI} disabled={parsing || !rawText.trim()}>
                  {parsing
                    ? <><Loader2 size={14} className="animate-spin" />Parsing with AI…</>
                    : <><Sparkles size={14} />Parse jobs</>}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <label className="field-label" htmlFor="excel-upload">
              Excel spreadsheet <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <div
              className="mt-2 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors"
              style={{ borderColor: "var(--border-default)" }}
              onClick={() => excelInputRef.current?.click()}
            >
              <FileSpreadsheet size={28} style={{ color: "var(--text-tertiary)" }} />
              {excelFile ? (
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{excelFile.name}</p>
              ) : (
                <>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Click to choose a .xlsx file</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Max 5 MB · one job per row</p>
                </>
              )}
              <input
                ref={excelInputRef}
                id="excel-upload"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                disabled={parsing}
                onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Expected columns (any order, case-insensitive): Title, Company Name, Location, Industry, Employment Type,
              Experience Required, Salary Range, Description, Required Skills, HR Email, Application Deadline. Only Title
              and Company Name are required — everything else can be left blank.
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              The HR Email / Contact column is read smartly: a real email routes automatic HR delivery, a form/portal
              link (e.g. Google Forms) becomes an external &ldquo;Apply&rdquo; redirect, and plain text like &ldquo;Check company portal&rdquo;
              is kept as an apply note at the top of the description instead of being dropped.
            </p>
            <div className="mt-4 flex items-center justify-end gap-3 flex-wrap">
              {parsing && (
                <Button variant="secondary" onClick={handleCancelParse}>
                  <Ban size={14} />Cancel
                </Button>
              )}
              <Button onClick={handleParseExcel} disabled={parsing || !excelFile}>
                {parsing
                  ? <><Loader2 size={14} className="animate-spin" />Reading spreadsheet…</>
                  : <><Upload size={14} />Parse jobs</>}
              </Button>
            </div>
          </>
        )}
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
            <div className="flex items-center gap-2">
              <Button variant="secondary" disabled={publishAllBusy} onClick={() => setShowCancelConfirm(true)}>
                <Ban size={14} />Cancel import
              </Button>
              {pendingCount > 1 && (
                <Button onClick={handlePublishAll} disabled={publishAllBusy}>
                  {publishAllBusy
                    ? <><Loader2 size={14} className="animate-spin" />Publishing all…</>
                    : <><Upload size={14} />Publish all ({pendingCount})</>}
                </Button>
              )}
            </div>
          </div>

          <PublishSummary summary={publishSummary} onDismiss={() => setPublishSummary(null)} />

          {jobs.length === 0 ? (
            <Alert>No jobs were extracted from the messages. Check that the text contains job postings and try again.</Alert>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <JobReviewCard
                  key={job._key}
                  formRef={(el) => {
                    if (el) formRefs.current.set(job._key, el);
                    else formRefs.current.delete(job._key);
                  }}
                  index={i}
                  total={jobs.length}
                  job={job}
                  expanded={expandedKeys.has(job._key)}
                  onToggleExpand={() =>
                    setExpandedKeys((prev) => {
                      const next = new Set(prev);
                      next.has(job._key) ? next.delete(job._key) : next.add(job._key);
                      return next;
                    })
                  }
                  published={publishedKeys.has(job._key)}
                  onPublished={() => setPublishedKeys((prev) => new Set([...prev, job._key]))}
                  onDiscard={() => discardJob(job._key)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showCancelConfirm} title="Cancel this import?" onClose={() => setShowCancelConfirm(false)}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {publishedKeys.size > 0
            ? `${publishedKeys.size} job${publishedKeys.size !== 1 ? "s" : ""} already published will stay published. `
            : ""}
          {pendingCount} unpublished job{pendingCount !== 1 ? "s" : ""} from this batch will be discarded and you&apos;ll return to the start.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>Keep reviewing</Button>
          <Button variant="danger" onClick={handleCancelImport}>
            <Ban size={14} />Cancel import
          </Button>
        </div>
      </Modal>
    </div>
  );
}
