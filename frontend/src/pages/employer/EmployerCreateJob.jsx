import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employerApi } from "../../api/employer.js";
import { JobForm } from "../../components/admin/JobForm.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { Toast } from "../../components/common/Toast.jsx";
import { useAuthStore } from "../../store/authStore.js";

export function EmployerCreateJob() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    employerApi.getProfile()
      .then(({ data }) => setProfile(data.data))
      .catch(() => setProfile({}));
  }, []);

  async function handleSubmit(form) {
    const { data } = await employerApi.createJob(form);
    setToastMessage(data.data.status === "DRAFT" ? "Job saved as a draft…" : "Job published! Taking you to your listings…");
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate("/employer/jobs");
    }, 2500);
  }

  if (!profile) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading" /></div>;

  const defaults = {
    companyName: profile.companyName ?? "",
    hrEmail: user?.email ?? "",
  };

  return (
    <>
      <Toast show={showToast} message={toastMessage} tone="success" duration={2500} />
      <p className="mb-1 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Employer</p>
      <h1 className="mb-7 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>Post a new job</h1>
      <JobForm initialValue={defaults} onSubmit={handleSubmit} submitLabel="Publish job" allowDraft />
    </>
  );
}
