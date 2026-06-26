import { useEffect, useRef, useState } from "react";
import { Banknote, BriefcaseBusiness, CalendarDays, Check, Clock3, MapPin, Share2, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { applicationsApi } from "../../api/applications.js";
import { jobsApi } from "../../api/jobs.js";
import { profileApi } from "../../api/profile.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { Toast } from "../../components/common/Toast.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { formatDate } from "../../utils/formatDate.js";

const REDIRECT_DELAY = 3500;

export function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [job, setJob] = useState(null);
  const [message, setMessage] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState({ show: false, text: "", tone: "error" });
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
    jobsApi.get(id).then(({ data }) => setJob(data.data));
    if (user?.role === "CANDIDATE") {
      applicationsApi.mine().then(({ data }) =>
        setAlreadyApplied(data.data.some((application) => application.jobId === Number(id))),
      );
    }
  }, [id, user]);

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
      setAlreadyApplied(true);
      showRedirectToast("Application submitted successfully! Taking you to your dashboard…", "/dashboard", "success");
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

  const skills = job.requiredSkills.split(",").map((skill) => skill.trim()).filter(Boolean);

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
              <p className="mt-2 text-lg font-medium" style={{ color: "var(--text-secondary)" }}>{job.companyName}</p>
            </div>
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              <Share2 size={16} />Share
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 pt-6" style={{ borderTop: "1px solid var(--border-default)" }}>
            <span className="chip flex items-center gap-2"><MapPin size={14} style={{ color: "var(--accent)" }} />{job.location}</span>
            <span className="chip flex items-center gap-2"><BriefcaseBusiness size={14} style={{ color: "var(--accent)" }} />{job.employmentType}</span>
            <span className="chip flex items-center gap-2"><Clock3 size={14} style={{ color: "var(--accent)" }} />{job.experienceRequired}</span>
            {job.salaryRange && <span className="chip flex items-center gap-2"><Banknote size={14} style={{ color: "var(--accent)" }} />{job.salaryRange}</span>}
            {job.gender && job.gender !== "Any" && <span className="chip flex items-center gap-2"><Users size={14} style={{ color: "var(--accent)" }} />{job.gender} only</span>}
            {job.nationality && job.nationality !== "Any Nationality" && <span className="chip flex items-center gap-2"><MapPin size={14} style={{ color: "var(--accent)" }} />{job.nationality}</span>}
          </div>
        </header>

        <section className="card-soft p-6 sm:p-8">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Job description</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{job.description}</div>
        </section>

        <section className="card-soft p-6 sm:p-8">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Required skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => <Badge key={skill} tone="green">{skill}</Badge>)}
          </div>
        </section>
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
            {alreadyApplied ? <><Check size={17} />Applied</> : applying ? "Submitting..." : job.isClosed ? "Applications closed" : "Apply now"}
          </Button>
          <p className="mt-3 text-center font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Your profile and resume are sent securely.</p>
        </div>
      </aside>
    </div>
    </>
  );
}
