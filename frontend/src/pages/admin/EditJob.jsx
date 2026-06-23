import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { JobForm } from "../../components/admin/JobForm.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
export function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  useEffect(() => { adminApi.job(id).then(({ data }) => setJob(data.data)); }, [id]);
  if (!job) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading job" /></div>;
  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Edit job</h1>
      <p className="mt-2 mb-8 text-base" style={{ color: "var(--text-secondary)" }}>Update the listing without affecting existing application history.</p>
      <JobForm initialValue={job} submitLabel="Save changes" onSubmit={async (payload) => { await adminApi.updateJob(id, payload); navigate("/admin/jobs"); }} />
    </div>
  );
}
