import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, Camera, Download, FileText, LockKeyhole, Trash2, UserRound } from "lucide-react";
import { authApi } from "../../api/auth.js";
import { profileApi } from "../../api/profile.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { LOCATIONS } from "../../utils/constants.js";
import { isValidMobile, isStrongPassword } from "../../utils/validators.js";

const selectClass = "form-control";
const sectionClass = "rounded-2xl border border-slate-200 p-5 sm:p-6";
const requiredFields = ["name", "mobile", "location", "designation", "experience", "skills", "education"];

function validateProfile(profile) {
  const errors = {};

  for (const field of requiredFields) {
    if (!profile[field]?.trim()) errors[field] = "This field is required.";
  }

  const name = profile.name?.trim() ?? "";
  const mobile = profile.mobile?.trim() ?? "";
  const location = profile.location ?? "";

  if (name && name.length < 2) errors.name = "Full name must be at least 2 characters.";
  if (name.length > 100) errors.name = "Full name must be 100 characters or fewer.";
  if (mobile && !isValidMobile(mobile)) errors.mobile = "Include your country code starting with + — for example, +966512345678 for Saudi or +91XXXXXXXXXX for India.";
  if (location && !LOCATIONS.includes(location)) errors.location = "Select a valid location.";
  if ((profile.designation?.trim().length ?? 0) > 150) errors.designation = "Designation must be 150 characters or fewer.";
  if (profile.experience?.trim() && !/^\d+$/.test(profile.experience.trim())) {
    errors.experience = "Total experience must be a whole number.";
  }
  if ((profile.skills?.trim().length ?? 0) > 1000) errors.skills = "Skills must be 1000 characters or fewer.";
  if ((profile.education?.trim().length ?? 0) > 500) errors.education = "Education must be 500 characters or fewer.";
  if ((profile.summary?.trim().length ?? 0) > 2000) errors.summary = "Summary must be 2000 characters or fewer.";

  return errors;
}

export function Profile() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);

  const load = useCallback(() => profileApi.get().then(({ data }) => setProfile(data.data)), []);
  useEffect(() => { load(); }, [load]);
  if (!profile) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading profile" /></div>;

  const update = (key) => (event) => {
    setProfile({ ...profile, [key]: event.target.value });
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
    setMessage("");
  };
  const updateNumeric = (key) => (event) => {
    const value = event.target.value.replace(/\D/g, "");
    setProfile({ ...profile, [key]: value });
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
    setMessage("");
  };

  async function save(event) {
    event.preventDefault();
    const errors = validateProfile(profile);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please fill all required fields with valid values.");
      return;
    }
    setSaving(true);
    setFieldErrors({});
    setFormError("");
    setMessage("");
    try {
      const keys = ["name", "mobile", "location", "designation", "experience", "skills", "education", "summary"];
      const payload = Object.fromEntries(keys.map((key) => [key, profile[key]?.trim() ?? ""]));
      const { data } = await profileApi.update(payload);
      setProfile(data.data);
      setMessage("Profile saved successfully.");
    } catch (requestError) {
      setFormError(requestError.response?.data?.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setFormError("");
    setMessage("");
    try {
      await profileApi.uploadPhoto(file);
      await load();
      setMessage("Profile photo updated.");
    } catch (requestError) {
      setFormError(requestError.response?.data?.message ?? "Photo upload failed. Please try again.");
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  }

  async function uploadResume(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    setFormError("");
    setMessage("");
    try {
      await profileApi.uploadResume(file);
      await load();
      setMessage("Resume uploaded successfully.");
    } catch (requestError) {
      setFormError(requestError.response?.data?.message ?? "Resume upload failed. Please try again.");
    } finally {
      setResumeUploading(false);
      event.target.value = "";
    }
  }

  async function download() {
    try {
      const { data } = await profileApi.downloadResume();
      window.location.assign(data.data.url);
    } catch (requestError) {
      setFormError(requestError.response?.data?.message ?? "Could not generate download link.");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="page-heading">Candidate profile</h1><p className="page-subheading">Keep your information complete and current for faster applications.</p></div>
        <span className="text-sm font-bold text-brand-700">{profile.profileCompletion}% complete</span>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${profile.profileCompletion}%` }} /></div>
      {message && <div className="mt-5"><Alert tone="success">{message}</Alert></div>}
      {formError && <div className="mt-5"><Alert>{formError}</Alert></div>}

      <div className="mt-7 space-y-6">
        {/* Profile photo — independent of the save form */}
        <section className={sectionClass}>
          <SectionTitle icon={Camera} title="Profile photo" text="Add a professional photo to personalize your candidate profile." />
          <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {profile.profilePhotoUrl
              ? <img alt={`${profile.name} profile`} className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm" src={profile.profilePhotoUrl} />
              : <div className="grid h-24 w-24 place-items-center rounded-2xl bg-brand-50 text-3xl font-bold text-brand-700">{profile.name?.[0]}</div>}
            <div className="flex flex-wrap gap-3">
              <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm ${photoUploading ? "bg-brand-400 cursor-not-allowed" : "bg-brand-600 hover:bg-brand-700"}`}>
                <Camera size={16} />
                {photoUploading ? "Uploading…" : "Upload photo"}
                <input className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={photoUploading} onChange={uploadPhoto} type="file" />
              </label>
              {profile.profilePhotoPath && (
                <Button variant="secondary" onClick={async () => { try { await profileApi.deletePhoto(); await load(); setMessage("Photo removed."); } catch (e) { setFormError(e.response?.data?.message ?? "Failed to remove photo."); } }}>
                  <Trash2 size={16} />Remove
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Main profile form: personal info + professional info + resume + save */}
        <form className="space-y-6" onSubmit={save}>
          <section className={sectionClass}>
            <SectionTitle icon={UserRound} title="Personal information" text="Your contact details are used for your applications." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input id="name" label="Full name" required error={fieldErrors.name} value={profile.name ?? ""} onChange={update("name")} />
              <Input id="email" label="Email address" value={profile.email ?? ""} readOnly />
              <Input id="mobile" label="Mobile number" required error={fieldErrors.mobile} value={profile.mobile ?? ""} onChange={update("mobile")} />
              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Location <span className="text-red-500" aria-hidden="true">*</span>
                </span>
                <select
                  aria-invalid={Boolean(fieldErrors.location)}
                  className={`${selectClass} ${fieldErrors.location ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                  value={profile.location ?? ""}
                  onChange={update("location")}
                >
                  <option value="" disabled>Select location</option>
                  {LOCATIONS.map((location) => <option key={location} value={location}>{location}</option>)}
                </select>
                {fieldErrors.location ? <span className="mt-1.5 block text-sm text-red-600">{fieldErrors.location}</span> : null}
              </label>
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle icon={BriefcaseBusiness} title="Professional information" text="Help employers understand your experience and capabilities." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input id="designation" label="Current designation" required error={fieldErrors.designation} value={profile.designation ?? ""} onChange={update("designation")} />
              <Input
                id="experience"
                label="Total experience (years)"
                required
                error={fieldErrors.experience}
                inputMode="numeric"
                pattern="[0-9]*"
                value={profile.experience ?? ""}
                onChange={updateNumeric("experience")}
              />
              <Input id="skills" label="Skills (comma separated)" required error={fieldErrors.skills} value={profile.skills ?? ""} onChange={update("skills")} />
              <Input id="education" label="Education" required error={fieldErrors.education} value={profile.education ?? ""} onChange={update("education")} />
              <label className="md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Professional summary</span>
                <textarea
                  aria-invalid={Boolean(fieldErrors.summary)}
                  className={`form-control min-h-32 resize-y ${fieldErrors.summary ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                  value={profile.summary ?? ""}
                  onChange={update("summary")}
                />
                {fieldErrors.summary ? <span className="mt-1.5 block text-sm text-red-600">{fieldErrors.summary}</span> : null}
              </label>
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle icon={FileText} title="Resume" text="PDF, DOC, or DOCX. Maximum file size 5 MB." />
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              {profile.resumeFilename
                ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{profile.resumeFilename}</p>
                      <p className="mt-1 text-xs text-slate-500">Uploaded {new Date(profile.resumeUploadedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={download}><Download size={16} />Download</Button>
                      <Button type="button" variant="danger" onClick={async () => { try { await profileApi.deleteResume(); await load(); setMessage("Resume removed."); } catch (e) { setFormError(e.response?.data?.message ?? "Failed to remove resume."); } }}><Trash2 size={16} />Remove</Button>
                    </div>
                  </div>
                )
                : <p className="text-sm text-slate-600">No resume uploaded yet.</p>}
            </div>
            <label className={`mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm ${resumeUploading ? "cursor-not-allowed text-slate-400" : "text-slate-700 hover:bg-slate-50"}`}>
              <FileText size={16} />
              {resumeUploading ? "Uploading…" : (profile.resumePath ? "Replace resume" : "Upload resume")}
              <input className="sr-only" accept=".pdf,.doc,.docx" disabled={resumeUploading} onChange={uploadResume} type="file" />
            </label>
          </section>

          <div className="flex justify-end">
            <Button className="w-full sm:w-auto sm:min-w-40" disabled={saving} type="submit">{saving ? "Saving…" : "Save profile"}</Button>
          </div>
        </form>

        <PasswordForm />
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, text }) {
  return <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={19} /></span><div><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-0.5 text-sm leading-6 text-slate-500">{text}</p></div></div>;
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setError("");
    setMessage("");
  };

  async function submit(event) {
    event.preventDefault();
    const errors = {};
    if (!form.currentPassword) errors.currentPassword = "Current password is required.";
    if (!form.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (!isStrongPassword(form.newPassword)) {
      errors.newPassword = "Password must be at least 8 characters with one uppercase letter and one number.";
    } else if (form.currentPassword && form.currentPassword === form.newPassword) {
      errors.newPassword = "New password must be different from your current password.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await authApi.changePassword(form);
      setMessage("Password changed successfully.");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Password change failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={sectionClass} onSubmit={submit}>
      <SectionTitle icon={LockKeyhole} title="Change password" text="Use a strong password that is different from your current password." />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Input id="currentPassword" label="Current password" type="password" required value={form.currentPassword} error={fieldErrors.currentPassword} onChange={update("currentPassword")} />
        <Input id="newPassword" label="New password" type="password" required value={form.newPassword} error={fieldErrors.newPassword} onChange={update("newPassword")} />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">At least 8 characters with one uppercase letter and one number.</p>
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      {message && <div className="mt-4"><Alert tone="success">{message}</Alert></div>}
      <Button className="mt-5 w-full sm:w-auto" disabled={saving} type="submit">{saving ? "Saving…" : "Change password"}</Button>
    </form>
  );
}
