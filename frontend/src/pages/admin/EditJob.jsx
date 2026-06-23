import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { JobForm } from "../../components/admin/JobForm.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { Toast } from "../../components/common/Toast.jsx";

const REDIRECT_DELAY = 3000;

export function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [toast, setToast] = useState({ show: false, text: "" });
  const timerRef = useRef(null);

  useEffect(() => { adminApi.job(id).then(({ data }) => setJob(data.data)); }, [id]);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function handleSubmit(payload) {
    await adminApi.updateJob(id, payload);
    setToast({ show: true, text: "Changes saved! Taking you to the jobs list…" });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
      setTimeout(() => navigate("/admin/jobs"), 400);
    }, REDIRECT_DELAY);
  }

  if (!job) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading job" /></div>;

  return (
    <>
      <Toast show={toast.show} message={toast.text} tone="success" duration={REDIRECT_DELAY} />
      <div>
        <p className="section-label">Admin</p>
        <h1 className="page-title text-3xl md:text-4xl">Edit job</h1>
        <p className="mt-2 mb-8 text-base" style={{ color: "var(--text-secondary)" }}>Update the listing without affecting existing application history.</p>
        <JobForm initialValue={job} submitLabel="Save changes" onSubmit={handleSubmit} />
      </div>
    </>
  );
}
