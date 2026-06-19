import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, Camera, Download, FileText, LockKeyhole, Trash2, UserRound } from "lucide-react";
import { authApi } from "../../api/auth.js";
import { profileApi } from "../../api/profile.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";

const selectClass = "form-control";
const sectionClass = "rounded-2xl border border-slate-200 p-5 sm:p-6";

export function Profile() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => profileApi.get().then(({ data }) => setProfile(data.data)), []);
  useEffect(() => { load(); }, [load]);
  if (!profile) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading profile" /></div>;

  const update = (key) => (event) => setProfile({ ...profile, [key]: event.target.value });
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const keys = ["name", "mobile", "location", "designation", "experience", "skills", "education", "summary"];
      const payload = Object.fromEntries(keys.map((key) => [key, profile[key] ?? ""]));
      const { data } = await profileApi.update(payload);
      setProfile(data.data);
      setMessage("Profile saved successfully.");
    } finally {
      setSaving(false);
    }
  }
  async function uploadResume(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await profileApi.uploadResume(file);
    await load();
    setMessage("Resume uploaded.");
  }
  async function download() {
    const { data } = await profileApi.downloadResume();
    window.location.assign(data.data.url);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="page-heading">Candidate profile</h1><p className="page-subheading">Keep your information complete and current for faster applications.</p></div>
        <span className="text-sm font-bold text-brand-700">{profile.profileCompletion}% complete</span>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${profile.profileCompletion}%` }} /></div>
      {message && <div className="mt-5"><Alert tone="success">{message}</Alert></div>}

      <div className="mt-7 space-y-6">
        <section className={sectionClass}>
          <SectionTitle icon={Camera} title="Profile photo" text="Add a professional photo to personalize your candidate profile." />
          <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {profile.profilePhotoUrl ? <img alt={`${profile.name} profile`} className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm" src={profile.profilePhotoUrl} /> : <div className="grid h-24 w-24 place-items-center rounded-2xl bg-brand-50 text-3xl font-bold text-brand-700">{profile.name?.[0]}</div>}
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"><Camera size={16} />Upload photo<input className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { await profileApi.uploadPhoto(file); await load(); } }} type="file" /></label>
              {profile.profilePhotoPath && <Button variant="secondary" onClick={async () => { await profileApi.deletePhoto(); await load(); }}><Trash2 size={16} />Remove</Button>}
            </div>
          </div>
        </section>

        <form className="space-y-6" onSubmit={save}>
          <section className={sectionClass}>
            <SectionTitle icon={UserRound} title="Personal information" text="Your contact details are used for your applications." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input id="name" label="Full name" value={profile.name ?? ""} onChange={update("name")} />
              <Input id="email" label="Email address" value={profile.email ?? ""} readOnly />
              <Input id="mobile" label="Saudi mobile" value={profile.mobile ?? ""} onChange={update("mobile")} />
              <label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Location</span><select className={selectClass} value={profile.location ?? ""} onChange={update("location")}><option value="">Select location</option><option>Riyadh</option><option>Jeddah</option><option>Dammam</option><option>Other</option></select></label>
            </div>
          </section>
          <section className={sectionClass}>
            <SectionTitle icon={BriefcaseBusiness} title="Professional information" text="Help employers understand your experience and capabilities." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input id="designation" label="Current designation" value={profile.designation ?? ""} onChange={update("designation")} />
              <Input id="experience" label="Total experience" value={profile.experience ?? ""} onChange={update("experience")} />
              <Input id="skills" label="Skills (comma separated)" value={profile.skills ?? ""} onChange={update("skills")} />
              <Input id="education" label="Education" value={profile.education ?? ""} onChange={update("education")} />
              <label className="md:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Professional summary</span><textarea className="form-control min-h-32 resize-y" value={profile.summary ?? ""} onChange={update("summary")} /></label>
            </div>
            <Button className="mt-5 w-full sm:w-auto" disabled={saving} type="submit">{saving ? "Saving..." : "Save profile"}</Button>
          </section>
        </form>

        <section className={sectionClass}>
          <SectionTitle icon={FileText} title="Resume" text="PDF, DOC, or DOCX. Maximum file size 5 MB." />
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            {profile.resumeFilename ? <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{profile.resumeFilename}</p><p className="mt-1 text-xs text-slate-500">Uploaded {new Date(profile.resumeUploadedAt).toLocaleDateString()}</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={download}><Download size={16} />Download</Button><Button variant="danger" onClick={async () => { await profileApi.deleteResume(); await load(); }}><Trash2 size={16} />Remove</Button></div></div> : <p className="text-sm text-slate-600">No resume uploaded yet.</p>}
          </div>
          <label className="mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><FileText size={16} />{profile.resumePath ? "Replace resume" : "Upload resume"}<input className="sr-only" accept=".pdf,.doc,.docx" onChange={uploadResume} type="file" /></label>
        </section>
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
  const [message, setMessage] = useState("");
  return (
    <form className={sectionClass} onSubmit={async (event) => { event.preventDefault(); await authApi.changePassword(form); setMessage("Password changed."); setForm({ currentPassword: "", newPassword: "" }); }}>
      <SectionTitle icon={LockKeyhole} title="Change password" text="Use a strong password that is different from your current password." />
      <div className="mt-5 grid gap-4 md:grid-cols-2"><Input id="currentPassword" label="Current password" type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /><Input id="newPassword" label="New password" type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></div>
      {message && <div className="mt-4"><Alert tone="success">{message}</Alert></div>}
      <Button className="mt-5 w-full sm:w-auto" type="submit">Change password</Button>
    </form>
  );
}
