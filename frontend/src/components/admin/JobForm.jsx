import { useState } from "react";
import { Alert } from "../common/Alert.jsx";
import { Button } from "../common/Button.jsx";
import { Input } from "../common/Input.jsx";

const emptyJob = { title: "", companyName: "", location: "", industry: "", employmentType: "", experienceRequired: "", salaryRange: "", description: "", requiredSkills: "", hrEmail: "", applicationDeadline: "", status: "ACTIVE" };

function validateJob(form) {
  const errors = {};
  const title = form.title?.trim() ?? "";
  const companyName = form.companyName?.trim() ?? "";
  const location = form.location?.trim() ?? "";
  const industry = form.industry?.trim() ?? "";
  const employmentType = form.employmentType?.trim() ?? "";
  const experienceRequired = form.experienceRequired?.trim() ?? "";
  const description = form.description?.trim() ?? "";
  const requiredSkills = form.requiredSkills?.trim() ?? "";
  const hrEmail = form.hrEmail?.trim() ?? "";
  const salaryRange = form.salaryRange?.trim() ?? "";

  if (!title) errors.title = "Job title is required.";
  else if (title.length < 2) errors.title = "Job title must be at least 2 characters.";
  else if (title.length > 150) errors.title = "Job title must be 150 characters or fewer.";

  if (!companyName) errors.companyName = "Company name is required.";
  else if (companyName.length < 2) errors.companyName = "Company name must be at least 2 characters.";
  else if (companyName.length > 150) errors.companyName = "Company name must be 150 characters or fewer.";

  if (!location) errors.location = "Location is required.";
  else if (location.length < 2) errors.location = "Location must be at least 2 characters.";
  else if (location.length > 100) errors.location = "Location must be 100 characters or fewer.";

  if (!industry) errors.industry = "Industry is required.";
  else if (industry.length < 2) errors.industry = "Industry must be at least 2 characters.";
  else if (industry.length > 100) errors.industry = "Industry must be 100 characters or fewer.";

  if (!employmentType) errors.employmentType = "Employment type is required.";
  else if (employmentType.length < 2) errors.employmentType = "Employment type must be at least 2 characters.";
  else if (employmentType.length > 100) errors.employmentType = "Employment type must be 100 characters or fewer.";

  if (!experienceRequired) errors.experienceRequired = "Experience required is required.";
  else if (experienceRequired.length > 100) errors.experienceRequired = "Experience required must be 100 characters or fewer.";

  if (!description) errors.description = "Job description is required.";
  else if (description.length < 20) errors.description = "Description must be at least 20 characters.";
  else if (description.length > 20000) errors.description = "Description must be 20,000 characters or fewer.";

  if (!requiredSkills) errors.requiredSkills = "Required skills is required.";
  else if (requiredSkills.length > 2000) errors.requiredSkills = "Required skills must be 2,000 characters or fewer.";

  if (!hrEmail) errors.hrEmail = "HR email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hrEmail)) errors.hrEmail = "Enter a valid email address.";

  if (salaryRange.length > 100) errors.salaryRange = "Salary range must be 100 characters or fewer.";

  return errors;
}

export function JobForm({ initialValue, onSubmit, submitLabel }) {
  const [form, setForm] = useState({ ...emptyJob, ...initialValue });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  async function submit(event) {
    event.preventDefault();
    const errors = validateJob(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ ...form, salaryRange: form.salaryRange || null, applicationDeadline: form.applicationDeadline ? new Date(form.applicationDeadline).toISOString() : null });
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to save job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <section className="rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Job information</h2>
        <p className="mt-1 text-sm text-slate-500">Core details candidates will see on the listing.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input id="title" label="Job title" required value={form.title} error={fieldErrors.title} onChange={update("title")} />
          <Input id="companyName" label="Company" required value={form.companyName} error={fieldErrors.companyName} onChange={update("companyName")} />
          <Input id="location" label="Location" required value={form.location} error={fieldErrors.location} onChange={update("location")} />
          <Input id="industry" label="Industry" required value={form.industry} error={fieldErrors.industry} onChange={update("industry")} />
          <Input id="employmentType" label="Employment type" required value={form.employmentType} error={fieldErrors.employmentType} onChange={update("employmentType")} />
          <Input id="experienceRequired" label="Experience required" required value={form.experienceRequired} error={fieldErrors.experienceRequired} onChange={update("experienceRequired")} />
          <Input id="salaryRange" label="Salary range (optional)" value={form.salaryRange ?? ""} error={fieldErrors.salaryRange} onChange={update("salaryRange")} />
          <Input id="applicationDeadline" label="Application deadline" type="date" value={form.applicationDeadline?.slice?.(0, 10) ?? ""} onChange={update("applicationDeadline")} />
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Requirements and routing</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input id="requiredSkills" label="Required skills" required value={form.requiredSkills} error={fieldErrors.requiredSkills} onChange={update("requiredSkills")} />
          <Input id="hrEmail" label="HR application email" type="email" required value={form.hrEmail} error={fieldErrors.hrEmail} onChange={update("hrEmail")} />
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Full job description <span className="text-red-500" aria-hidden="true">*</span>
            </span>
            <textarea
              aria-invalid={Boolean(fieldErrors.description)}
              className={`form-control min-h-48 resize-y ${fieldErrors.description ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
              value={form.description}
              onChange={update("description")}
            />
            {fieldErrors.description && <span className="mt-1.5 block text-sm text-red-600">{fieldErrors.description}</span>}
          </label>
        </div>
      </section>
      {error && <Alert>{error}</Alert>}
      <div className="flex justify-end"><Button className="w-full sm:w-auto sm:min-w-40" disabled={submitting} type="submit">{submitting ? "Saving..." : submitLabel}</Button></div>
    </form>
  );
}
