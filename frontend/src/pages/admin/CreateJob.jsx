import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { JobForm } from "../../components/admin/JobForm.jsx";
export function CreateJob() {
  const navigate = useNavigate();
  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Create a job</h1>
      <p className="mt-2 mb-8 text-base" style={{ color: "var(--text-secondary)" }}>Publish a new opportunity and route applications to the correct HR contact.</p>
      <JobForm submitLabel="Create job" onSubmit={async (payload) => { await adminApi.createJob(payload); navigate("/admin/jobs"); }} />
    </div>
  );
}
