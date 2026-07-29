import { useEffect, useRef, useState } from "react";
import { Banknote, Bookmark, BriefcaseBusiness, CalendarDays, Check, Clock3, Flag, Loader2, MapPin, SearchX, Share2, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { applicationsApi } from "../../api/applications.js";
import { jobsApi } from "../../api/jobs.js";
import { profileApi } from "../../api/profile.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Select } from "../../components/common/Select.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { Toast } from "../../components/common/Toast.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { useAppliedJobsStore } from "../../store/appliedJobsStore.js";
import { useSavedJobsStore } from "../../store/savedJobsStore.js";
import { formatDate } from "../../utils/formatDate.js";

const REDIRECT_DELAY = 3500;

const REPORT_REASONS = [
  { value: "MISLEADING_SALARY", label: "Misleading salary" },
  { value: "SUSPICIOUS_CONTACT", label: "Suspicious contact info" },
  { value: "DUPLICATE_LISTING", label: "Duplicate listing" },
  { value: "SCAM_OR_FRAUD", label: "Scam or fraud" },
  { value: "OTHER", label: "Other" },
];

export function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isSaved, toggle: toggleSave, fetchIds } = useSavedJobsStore();
  const { isApplied, fetchIds: fetchAppliedIds, markApplied } = useAppliedJobsStore();
  const isCandidate = user?.role === "CANDIDATE";
  const alreadyApplied = isCandidate && isApplied(Number(id));
  const [job, setJob] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState({ show: false, text: "", tone: "error" });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("MISLEADING_SALARY");
  const [reportNote, setReportNote] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const timerRef = useRef(null);

  function showRedirectToast(text, path, tone = "error") {
    setToast({ show: true, text, tone });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
      setTimeout(() => navigate(path), 400);
    }, REDIRECT_DELAY);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    setJob(null);
    setNotFound(false);
    jobsApi.get(id)
      .then(({ data }) => setJob(data.data))
      .catch(() => setNotFound(true));
    if (user?.role === "CANDIDATE") {
      fetchIds();
      fetchAppliedIds();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  if (notFound) {
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl p-8 text-center" style={{ border: "1.5px dashed var(--border-strong)" }}>
        <div>
          <SearchX className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
          <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>This job is no longer available</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            It may have closed, been filled, or been removed by the employer.
          </p>
          <Link
            to="/jobs"
            className="btn-primary mt-5 inline-flex"
            style={{ minHeight: "40px", padding: "0 20px", fontSize: "14px" }}
          >
            Browse open roles
          </Link>
        </div>
      </div>
    );
  }

  if (!job) return <div className="grid min-h-72 place-items-center"><Spinner label="Loading job details" /></div>;

  async function apply() {
    if (!user) return navigate("/login", { state: { from: { pathname: `/jobs/${id}` } } });
    if (user.role !== "CANDIDATE") return setMessage("Administrator accounts cannot apply.");
    if (alreadyApplied) return setMessage("Already applied.");
    setApplying(true);
    try {
      const { data: profileResponse } = await profileApi.get();
      const profile = profileResponse.data;
      if (!profile.isApplicationProfileComplete) {
        showRedirectToast("Your profile is incomplete — please add your designation, experience, and skills before applying.", "/dashboard/profile");
        return;
      }
      if (!profile.resumePath) {
        showRedirectToast("You haven't uploaded a resume yet. Please upload one before applying.", "/dashboard/profile");
        return;
      }
      await applicationsApi.apply(job.id);
      markApplied(job.id);
      showRedirectToast("Application submitted! Browse more open roles.", "/jobs", "success");
    } catch (error) {
      const text = error.response?.data?.message ?? "Application failed";
      setMessage(text);
      if (error.response?.status === 422) {
        showRedirectToast(text, "/dashboard/profile");
      }
    } finally {
      setApplying(false);
    }
  }

  async function submitReport() {
    setReportSubmitting(true);
    setReportError("");
    try {
      await jobsApi.report(id, { reason: reportReason, note: reportNote.trim() || undefined });
      setShowReportModal(false);
      setReportNote("");
      setToast({ show: true, text: "Report submitted — our team will review this listing.", tone: "success" });
      timerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), REDIRECT_DELAY);
    } catch (error) {
      setReportError(error.response?.data?.message ?? "Unable to submit report");
    } finally {
      setReportSubmitting(false);
    }
  }

  const skills = (job.requiredSkills ?? "").split(",").map((skill) => skill.trim()).filter(Boolean);

  return (
    <>
    <Toast show={toast.show} message={toast.text} tone={toast.tone} duration={REDIRECT_DELAY} />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <header className="card-soft p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {job.isClosed ? <Badge tone="red">Applications closed</Badge> : <Badge tone="green">Actively hiring</Badge>}
                <Badge>{job.industry}</Badge>
              </div>
              <h1 className="page-title text-3xl md:text-4xl">{job.title}</h1>
              {job.employer ? (
                <Link
                  className="mt-2 inline-block text-lg font-medium text-[var(--text-secondary)] hover:text-blue-600 hover:underline"
                  to={`/company/${job.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {job.companyName}
                </Link>
              ) : (
                <p className="mt-2 text-lg font-medium" style={{ color: "var(--text-secondary)" }}>{job.companyName}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isCandidate && (
                <Button
                  variant="secondary"
                  onClick={() => toggleSave(Number(id))}
                  aria-label={isSaved(Number(id)) ? "Remove from saved" : "Save job"}
                >
                  <Bookmark
                    size={16}
                    style={{
                      fill: isSaved(Number(id)) ? "var(--accent)" : "none",
                      color: isSaved(Number(id)) ? "var(--accent)" : "currentColor",
                      transition: "fill 0.15s, color 0.15s",
                    }}
                  />
                  {isSaved(Number(id)) ? "Saved" : "Save"}
                </Button>
              )}
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                <Share2 size={16} />Share
              </Button>
              {isCandidate && (
                <Button variant="ghost" onClick={() => setShowReportModal(true)} style={{ color: "var(--text-tertiary)" }} aria-label="Report this job">
                  <Flag size={16} />Report
                </Button>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 pt-6" style={{ borderTop: "1px solid var(--border-default)" }}>
            {job.location && <span className="chip flex items-center gap-2"><MapPin size={14} style={{ color: "var(--accent)" }} />{job.location}</span>}
            {job.employmentType && <span className="chip flex items-center gap-2"><BriefcaseBusiness size={14} style={{ color: "var(--accent)" }} />{job.employmentType}</span>}
            {job.experienceRequired && <span className="chip flex items-center gap-2"><Clock3 size={14} style={{ color: "var(--accent)" }} />{job.experienceRequired}</span>}
            {job.salaryRange && <span className="chip flex items-center gap-2"><Banknote size={14} style={{ color: "var(--accent)" }} />{job.salaryRange}</span>}
            {job.gender && job.gender !== "Any" && <span className="chip flex items-center gap-2"><Users size={14} style={{ color: "var(--accent)" }} />{job.gender} only</span>}
            {job.nationality && job.nationality !== "Any Nationality" && <span className="chip flex items-center gap-2"><MapPin size={14} style={{ color: "var(--accent)" }} />{job.nationality}</span>}
          </div>
        </header>

        {job.description && (
          <section className="card-soft p-6 sm:p-8">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Job description</h2>
            <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{job.description}</div>
          </section>
        )}

        {skills.length > 0 && (
          <section className="card-soft p-6 sm:p-8">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Required skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => <Badge key={skill} tone="green">{skill}</Badge>)}
            </div>
          </section>
        )}

        {job.employer?.description && (
          <section className="card-soft p-6 sm:p-8">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>About {job.employer.companyName || job.companyName}</h2>
            <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{job.employer.description}</div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card-soft p-5 sm:p-6">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Apply for this position</h2>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            {alreadyApplied ? "Your application has been submitted." : "Use your completed SaudiaCareers profile and resume."}
          </p>
          {job.salaryRange && (
            <div className="mt-4 rounded-xl p-3" style={{ background: "var(--bg-elev)" }}>
              <span className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Salary</span>
              <p className="mt-1 font-semibold" style={{ color: "var(--text-primary)" }}>{job.salaryRange}</p>
            </div>
          )}
          {job.applicationDeadline && (
            <div className="mt-3 flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bg-elev)" }}>
              <CalendarDays size={17} style={{ color: "var(--accent)" }} />
              <div>
                <span className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Deadline</span>
                <p className="mt-0.5 font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{formatDate(job.applicationDeadline)}</p>
              </div>
            </div>
          )}
          {message && <div className="mt-4"><Alert tone={message.includes("success") ? "success" : "error"}>{message}</Alert></div>}
          <Button className="mt-5 w-full" disabled={job.isClosed || alreadyApplied || applying} onClick={apply}>
            {alreadyApplied
              ? <><Check size={17} />Applied</>
              : applying
              ? <><Loader2 size={16} className="animate-spin shrink-0" />Submitting…</>
              : job.isClosed ? "Applications closed" : "Apply now"}
          </Button>
          <p className="mt-3 text-center font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Your profile and resume are sent securely.</p>
        </div>
      </aside>
    </div>

    <Modal isOpen={showReportModal} title="Report this job" onClose={() => setShowReportModal(false)}>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Let us know what&apos;s wrong with this listing. Our team reviews every report.
      </p>
      <div className="mt-3">
        <Select label="Reason" value={reportReason} onChange={(e) => setReportReason(e.target.value)} options={REPORT_REASONS} />
      </div>
      <label className="mt-3 block">
        <span className="field-label">Additional details (optional)</span>
        <textarea className="field-box min-h-24 resize-y" value={reportNote} onChange={(e) => setReportNote(e.target.value)} placeholder="Anything that helps us review this faster…" />
      </label>
      {reportError && <div className="mt-3"><Alert>{reportError}</Alert></div>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setShowReportModal(false)}>Cancel</Button>
        <Button variant="danger" disabled={reportSubmitting} onClick={submitReport}>
          {reportSubmitting ? <><Loader2 size={14} className="animate-spin shrink-0" />Submitting…</> : "Submit report"}
        </Button>
      </div>
    </Modal>
    </>
  );
}
