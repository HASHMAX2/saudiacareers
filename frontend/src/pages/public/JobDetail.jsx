import { useEffect, useState } from "react";
import { Banknote, BriefcaseBusiness, CalendarDays, Check, Clock3, MapPin, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { applicationsApi } from "../../api/applications.js";
import { jobsApi } from "../../api/jobs.js";
import { profileApi } from "../../api/profile.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { formatDate } from "../../utils/formatDate.js";

export function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [job, setJob] = useState(null);
  const [message, setMessage] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applying, setApplying] = useState(false);

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
        navigate("/dashboard/profile", { state: { message: "Complete designation, experience, and skills before applying." } });
        return;
      }
      if (!profile.resumePath) {
        navigate("/dashboard/profile", { state: { message: "Upload a resume before applying." } });
        return;
      }
      await applicationsApi.apply(job.id);
      setMessage("Application submitted successfully.");
      setAlreadyApplied(true);
    } catch (error) {
      const text = error.response?.data?.message ?? "Application failed";
      setMessage(text);
      if (error.response?.status === 422) navigate("/dashboard/profile", { state: { message: text } });
    } finally {
      setApplying(false);
    }
  }

  const skills = job.requiredSkills.split(",").map((skill) => skill.trim()).filter(Boolean);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="space-y-6">
        <header className="surface-card p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">{job.isClosed ? <Badge tone="red">Applications closed</Badge> : <Badge tone="green">Actively hiring</Badge>}<Badge>{job.industry}</Badge></div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{job.title}</h1>
              <p className="mt-2 text-lg font-medium text-slate-600">{job.companyName}</p>
            </div>
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(window.location.href)}><Share2 size={16} />Share</Button>
          </div>
          <div className="mt-6 grid gap-3 border-t border-slate-100 pt-6 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
            <span className="flex items-center gap-2"><MapPin size={17} className="text-brand-600" />{job.location}</span>
            <span className="flex items-center gap-2"><BriefcaseBusiness size={17} className="text-brand-600" />{job.employmentType}</span>
            <span className="flex items-center gap-2"><Clock3 size={17} className="text-brand-600" />{job.experienceRequired}</span>
            {job.salaryRange && <span className="flex items-center gap-2"><Banknote size={17} className="text-brand-600" />{job.salaryRange}</span>}
          </div>
        </header>

        <section className="surface-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Job description</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 sm:text-base">{job.description}</div>
        </section>

        <section className="surface-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Required skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">{skills.map((skill) => <Badge key={skill} tone="green">{skill}</Badge>)}</div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="surface-card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Apply for this position</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{alreadyApplied ? "Your application has been submitted." : "Use your completed SaudiaCareers profile and resume."}</p>
          {job.applicationDeadline && <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><CalendarDays className="text-brand-600" size={18} /><div><span className="block text-xs text-slate-500">Application deadline</span><strong>{formatDate(job.applicationDeadline)}</strong></div></div>}
          {message && <div className="mt-4"><Alert tone={message.includes("success") ? "success" : "error"}>{message}</Alert></div>}
          <Button className="mt-5 w-full" disabled={job.isClosed || alreadyApplied || applying} onClick={apply}>
            {alreadyApplied ? <><Check size={17} />Applied</> : applying ? "Submitting..." : job.isClosed ? "Applications closed" : "Apply now"}
          </Button>
          <p className="mt-3 text-center text-xs text-slate-500">Your profile and resume are sent securely.</p>
        </div>
      </aside>
    </div>
  );
}
