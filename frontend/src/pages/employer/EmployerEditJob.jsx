import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jobsApi } from "../../api/jobs.js";
import { employerApi } from "../../api/employer.js";
import { JobForm } from "../../components/admin/JobForm.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { Toast } from "../../components/common/Toast.jsx";

export function EmployerEditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    jobsApi.get(id).then(({ data }) => setJob(data.data)).catch(() => navigate("/employer/jobs"));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(form) {
    await employerApi.updateJob(id, form);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate("/employer/jobs");
    }, 2500);
  }

  if (!job) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading job" /></div>;

  return (
    <>
      <Toast show={showToast} message="Changes saved! Taking you to your listings…" tone="success" duration={2500} />
      <p className="section-label">Employer</p>
      <h1 className="page-title mb-7 text-3xl md:text-4xl">Edit job</h1>
      <JobForm initialValue={job} onSubmit={handleSubmit} submitLabel="Save changes" />
    </>
  );
}
