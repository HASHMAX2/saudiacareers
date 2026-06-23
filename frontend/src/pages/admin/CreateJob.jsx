import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { JobForm } from "../../components/admin/JobForm.jsx";
import { Toast } from "../../components/common/Toast.jsx";

const REDIRECT_DELAY = 3000;

export function CreateJob() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, text: "" });
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function handleSubmit(payload) {
    await adminApi.createJob(payload);
    setToast({ show: true, text: "Job published! Taking you to the jobs list…" });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
      setTimeout(() => navigate("/admin/jobs"), 400);
    }, REDIRECT_DELAY);
  }

  return (
    <>
      <Toast show={toast.show} message={toast.text} tone="success" duration={REDIRECT_DELAY} />
      <div>
        <p className="section-label">Admin</p>
        <h1 className="page-title text-3xl md:text-4xl">Create a job</h1>
        <p className="mt-2 mb-8 text-base" style={{ color: "var(--text-secondary)" }}>Publish a new opportunity and route applications to the correct HR contact.</p>
        <JobForm submitLabel="Create job" onSubmit={handleSubmit} />
      </div>
    </>
  );
}
