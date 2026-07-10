import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    employerApi.getJob(id).then(({ data }) => setJob(data.data)).catch(() => navigate("/employer/jobs"));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isRevision = !!job?.revisesJobId;

  async function handleSubmit(form) {
    await employerApi.updateJob(id, form);
    if (isRevision) {
      // Save the edits, then submit the working copy for admin review in the
      // same action — the live job is untouched until it's approved.
      await employerApi.updateJobStatus(id, { status: "REVISION_PENDING_APPROVAL" });
    }
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate(isRevision ? "/employer/jobs/pending" : "/employer/jobs");
    }, 2500);
  }

  if (!job) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading job" /></div>;

  return (
    <>
      <Toast
        show={showToast}
        message={isRevision ? "Update submitted for admin review!" : "Changes saved! Taking you to your listings…"}
        tone="success"
        duration={2500}
      />
      <p className="mb-1 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Employer</p>
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>
        {isRevision ? "Edit update" : "Edit job"}
      </h1>
      {isRevision && (
        <div className="mb-6 rounded-2xl p-4 text-sm" style={{ background: "var(--gold-bg)", color: "#8A5D10", border: "1px solid #F0DFAE" }}>
          You&apos;re editing an update to <strong>&quot;{job.revisesJob?.title}&quot;</strong>. The live listing stays
          exactly as it is for candidates until an admin approves this change.
        </div>
      )}
      <JobForm initialValue={job} onSubmit={handleSubmit} submitLabel={isRevision ? "Submit for review" : "Save changes"} />
    </>
  );
}
