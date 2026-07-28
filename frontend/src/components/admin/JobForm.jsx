import { Loader2 } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Alert } from "../common/Alert.jsx";
import { Button } from "../common/Button.jsx";
import { Input } from "../common/Input.jsx";
import { Select } from "../common/Select.jsx";
import { EXPERIENCE_LEVELS, INDUSTRIES, SALARY_RANGES } from "../../utils/constants.js";
import { isCompanyEmail } from "../../utils/validators.js";
import { extractErrorMessage } from "../../utils/apiError.js";

const EMPLOYMENT_TYPE_OPTIONS = ["Permanent", "Contractual"];
const GENDER_OPTIONS = ["Any", "Male", "Female"];
const NATIONALITY_OPTIONS = ["Any Nationality", "Saudi", "Non-Saudi"];
const WORK_MODE_OPTIONS = ["Remote", "Hybrid", "On-site"];
const APPLY_METHOD_OPTIONS = [
  { value: "PLATFORM", label: "Apply on platform" },
  { value: "EXTERNAL_URL", label: "Redirect to external URL" },
  { value: "EMAIL", label: "Send application to company email" },
];
const LISTING_DURATION_OPTIONS = [30, 45, 60];

const emptyJob = {
  title: "", companyName: "", location: "", industry: "", employmentType: "", experienceRequired: "",
  salaryRange: "", description: "", requiredSkills: "", hrEmail: "", gender: "Any", nationality: "Any Nationality",
  applicationDeadline: "", status: "ACTIVE",
  department: "", workMode: "Remote", applyMethod: "PLATFORM", applyContact: "",
  screeningQuestion: "", listingDurationDays: 30,
};

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

  if (!employmentType) errors.employmentType = "Employment type is required.";
  else if (employmentType.length < 2) errors.employmentType = "Employment type must be at least 2 characters.";
  else if (employmentType.length > 100) errors.employmentType = "Employment type must be 100 characters or fewer.";

  if (!experienceRequired) errors.experienceRequired = "Experience required is required.";

  if (!description) errors.description = "Job description is required.";
  else if (description.length < 20) errors.description = "Description must be at least 20 characters.";
  else if (description.length > 20000) errors.description = "Description must be 20,000 characters or fewer.";

  if (!requiredSkills) errors.requiredSkills = "Required skills is required.";
  else if (requiredSkills.length > 2000) errors.requiredSkills = "Required skills must be 2,000 characters or fewer.";

  if (!hrEmail) errors.hrEmail = "HR email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hrEmail)) errors.hrEmail = "Enter a valid email address.";
  else if (!isCompanyEmail(hrEmail)) {
    errors.hrEmail = "Please enter a valid company email address. Personal email providers are not allowed.";
  }

  if (salaryRange.length > 100) errors.salaryRange = "Salary range must be 100 characters or fewer.";

  const applyContact = form.applyContact?.trim() ?? "";
  if (form.applyMethod && form.applyMethod !== "PLATFORM" && !applyContact) {
    errors.applyContact = form.applyMethod === "EMAIL"
      ? "Enter the email address applications should be sent to."
      : "Enter the URL candidates should be redirected to.";
  } else if (form.applyMethod === "EMAIL" && applyContact && !isCompanyEmail(applyContact)) {
    errors.applyContact = "Please enter a valid company email address. Personal email providers are not allowed.";
  }

  return errors;
}

function mergeWithDefaults(initialValue) {
  const merged = { ...emptyJob };
  for (const key of Object.keys(emptyJob)) {
    if (initialValue?.[key] !== undefined && initialValue[key] !== null) {
      merged[key] = initialValue[key];
    }
  }
  return merged;
}

export const JobForm = forwardRef(function JobForm({ initialValue, onSubmit, submitLabel, allowDraft, onCancel }, ref) {
  const [form, setForm] = useState(() => mergeWithDefaults(initialValue));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const update = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Returns true/false rather than throwing, so a caller driving many of these
  // at once (e.g. a bulk "publish all") can tell which ones actually succeeded
  // without each one aborting the batch.
  async function submit(event, asDraft = false) {
    event.preventDefault();
    const errors = validateJob(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    setError("");
    asDraft ? setSavingDraft(true) : setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        salaryRange: form.salaryRange || null,
        gender: form.gender || "Any",
        nationality: form.nationality || "Any Nationality",
        applicationDeadline: form.applicationDeadline ? new Date(form.applicationDeadline).toISOString() : null,
        department: form.department?.trim() || null,
        workMode: form.workMode || null,
        applyMethod: form.applyMethod || "PLATFORM",
        applyContact: form.applyMethod && form.applyMethod !== "PLATFORM" ? form.applyContact?.trim() : null,
        screeningQuestion: form.screeningQuestion?.trim() || null,
        listingDurationDays: Number(form.listingDurationDays) || 30,
        ...(allowDraft ? { saveAsDraft: asDraft } : {}),
      });
      return true;
    } catch (requestError) {
      setError(extractErrorMessage(requestError, "Unable to save job"));
      return false;
    } finally {
      setSubmitting(false);
      setSavingDraft(false);
    }
  }

  // Lets a parent (e.g. a "publish all" batch action) trigger this exact form's
  // own validate → submit → error-display cycle programmatically, instead of
  // re-implementing a parallel submit path that bypasses per-field validation.
  useImperativeHandle(ref, () => ({
    publish: () => submit({ preventDefault() {} }),
  }));

  return (
    <form className="space-y-5" onSubmit={submit}>
      <section className="card-soft p-5 sm:p-6">
        <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Job information</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Core details candidates will see on the listing.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input id="title" label="Job title" required value={form.title} error={fieldErrors.title} onChange={update("title")} />
          <Input id="companyName" label="Company" required value={form.companyName} error={fieldErrors.companyName} onChange={update("companyName")} />
          <Input id="location" label="Location" required value={form.location} error={fieldErrors.location} onChange={update("location")} />
          <Select
            id="industry"
            label="Industry"
            required
            value={form.industry}
            error={fieldErrors.industry}
            onChange={update("industry")}
            options={INDUSTRIES}
            placeholder="Select an industry"
          />
          <Select
            id="employmentType"
            label="Employment type"
            required
            value={form.employmentType}
            error={fieldErrors.employmentType}
            onChange={update("employmentType")}
            options={EMPLOYMENT_TYPE_OPTIONS}
            placeholder="Select employment type"
          />
          <Select
            id="experienceRequired"
            label="Experience required"
            required
            value={form.experienceRequired}
            error={fieldErrors.experienceRequired}
            onChange={update("experienceRequired")}
            options={EXPERIENCE_LEVELS}
            placeholder="Select experience level"
          />
          <Select
            label="Salary range (optional)"
            value={form.salaryRange ?? ""}
            onChange={update("salaryRange")}
            options={SALARY_RANGES}
            placeholder="Not specified"
          />
          <Input id="applicationDeadline" label="Application deadline" type="date" value={form.applicationDeadline?.slice?.(0, 10) ?? ""} onChange={update("applicationDeadline")} />
          <Select
            label="Gender preference"
            value={form.gender ?? "Any"}
            onChange={update("gender")}
            options={GENDER_OPTIONS}
          />
          <Select
            label="Nationality preference"
            value={form.nationality ?? "Any Nationality"}
            onChange={update("nationality")}
            options={NATIONALITY_OPTIONS}
          />
        </div>
      </section>
      <section className="card-soft p-5 sm:p-6">
        <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Posting details</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Department, work mode, and how candidates should apply.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input id="department" label="Department (optional)" value={form.department} onChange={update("department")} />
          <Select
            label="Work mode"
            value={form.workMode ?? "Remote"}
            onChange={update("workMode")}
            options={WORK_MODE_OPTIONS}
          />
          <Select
            label="Listing duration"
            value={form.listingDurationDays ?? 30}
            onChange={update("listingDurationDays")}
            options={LISTING_DURATION_OPTIONS.map((d) => ({ value: d, label: `${d} days` }))}
          />
          <Select
            label="Candidate apply method"
            value={form.applyMethod ?? "PLATFORM"}
            onChange={update("applyMethod")}
            options={APPLY_METHOD_OPTIONS}
          />
          {form.applyMethod && form.applyMethod !== "PLATFORM" && (
            <Input
              id="applyContact"
              label={form.applyMethod === "EMAIL" ? "Apply email" : "Apply URL"}
              required
              value={form.applyContact}
              error={fieldErrors.applyContact}
              onChange={update("applyContact")}
            />
          )}
          <div className="md:col-span-2">
            <Input
              id="screeningQuestion"
              label="Screening question (optional)"
              value={form.screeningQuestion}
              onChange={update("screeningQuestion")}
              placeholder="e.g. Share one relevant project you've shipped."
            />
          </div>
        </div>
      </section>
      <section className="card-soft p-5 sm:p-6">
        <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Requirements and routing</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input id="requiredSkills" label="Required skills" required value={form.requiredSkills} error={fieldErrors.requiredSkills} onChange={update("requiredSkills")} />
          <Input id="hrEmail" label="HR application email" type="email" required value={form.hrEmail} error={fieldErrors.hrEmail} onChange={update("hrEmail")} />
          <label className="md:col-span-2">
            <span className="field-label">
              Full job description <span className="text-red-500" aria-hidden="true">*</span>
            </span>
            <textarea
              aria-invalid={Boolean(fieldErrors.description)}
              className={`field-box min-h-48 resize-y ${fieldErrors.description ? "border-red-400" : ""}`}
              value={form.description}
              onChange={update("description")}
            />
            {fieldErrors.description && <span className="mt-1 block text-xs text-red-600">{fieldErrors.description}</span>}
          </label>
        </div>
      </section>
      {error && <Alert>{error}</Alert>}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            className="w-full sm:w-auto sm:min-w-40"
            variant="secondary"
            disabled={submitting || savingDraft}
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        {allowDraft && (
          <Button
            className="w-full sm:w-auto sm:min-w-40"
            variant="secondary"
            disabled={submitting || savingDraft}
            type="button"
            onClick={(e) => submit(e, true)}
          >
            {savingDraft ? <><Loader2 size={14} className="animate-spin shrink-0" />Saving draft…</> : "Save draft"}
          </Button>
        )}
        <Button className="w-full sm:w-auto sm:min-w-40" disabled={submitting || savingDraft} type="submit">
          {submitting ? <><Loader2 size={14} className="animate-spin shrink-0" />Saving…</> : submitLabel}
        </Button>
      </div>
    </form>
  );
});
