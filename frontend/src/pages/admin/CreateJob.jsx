import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { JobForm } from "../../components/admin/JobForm.jsx";
export function CreateJob() {
  const navigate = useNavigate();
  return <div><h1 className="page-heading">Create a job</h1><p className="page-subheading mb-7">Publish a new opportunity and route applications to the correct HR contact.</p><JobForm submitLabel="Create job" onSubmit={async (payload) => { await adminApi.createJob(payload); navigate("/admin/jobs"); }} /></div>;
}
