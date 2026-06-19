import { Alert } from "../common/Alert.jsx";
import { Button } from "../common/Button.jsx";
import { Input } from "../common/Input.jsx";
import { useState } from "react";

const emptyJob = { title: "", companyName: "", location: "", industry: "", employmentType: "", experienceRequired: "", salaryRange: "", description: "", requiredSkills: "", hrEmail: "", applicationDeadline: "", status: "ACTIVE" };

export function JobForm({ initialValue, onSubmit, submitLabel }) {
  const [form, setForm] = useState({ ...emptyJob, ...initialValue });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  async function submit(event) {
    event.preventDefault();
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
          <Input id="title" label="Job title" value={form.title} onChange={update("title")} required />
          <Input id="companyName" label="Company" value={form.companyName} onChange={update("companyName")} required />
          <Input id="location" label="Location" value={form.location} onChange={update("location")} required />
          <Input id="industry" label="Industry" value={form.industry} onChange={update("industry")} required />
          <Input id="employmentType" label="Employment type" value={form.employmentType} onChange={update("employmentType")} required />
          <Input id="experienceRequired" label="Experience required" value={form.experienceRequired} onChange={update("experienceRequired")} required />
          <Input id="salaryRange" label="Salary range (optional)" value={form.salaryRange ?? ""} onChange={update("salaryRange")} />
          <Input id="applicationDeadline" label="Application deadline" type="date" value={form.applicationDeadline?.slice?.(0, 10) ?? ""} onChange={update("applicationDeadline")} />
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Requirements and routing</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input id="requiredSkills" label="Required skills" value={form.requiredSkills} onChange={update("requiredSkills")} required />
          <Input id="hrEmail" label="HR application email" type="email" value={form.hrEmail} onChange={update("hrEmail")} required />
          <label className="md:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Full job description</span><textarea className="form-control min-h-48 resize-y" value={form.description} onChange={update("description")} required /></label>
        </div>
      </section>
      {error && <Alert>{error}</Alert>}
      <div className="flex justify-end"><Button className="w-full sm:w-auto sm:min-w-40" disabled={submitting} type="submit">{submitting ? "Saving..." : submitLabel}</Button></div>
    </form>
  );
}
