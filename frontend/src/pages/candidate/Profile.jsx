import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award, Briefcase, Camera, Download,
  FileText, Github, Globe, GraduationCap, Linkedin,
  Loader2, MapPin, Pencil, Phone, Plus, Target, Trash2,
} from "lucide-react";
import { profileApi } from "../../api/profile.js";
import { Button } from "../../components/common/Button.jsx";
import { Combobox } from "../../components/common/Combobox.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Select } from "../../components/common/Select.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { COUNTRIES } from "../../utils/countries.js";
import {
  AVAILABILITY_OPTIONS,
  INDUSTRIES,
  MARITAL_STATUS_OPTIONS,
  MONTHS_LONG,
  WORK_AUTHORIZATION_OPTIONS,
} from "../../utils/constants.js";

// ─── Completion config ────────────────────────────────────────────────────────
const COMPLETION_ITEMS = [
  { key: "name",       label: "Full Name",          pct: 5,  check: (p) => !!p.name },
  { key: "mobile",     label: "Mobile Number",      pct: 5,  check: (p) => !!p.mobile },
  { key: "location",   label: "Location",           pct: 5,  check: (p) => !!(p.country || p.city) },
  { key: "designation",label: "Current Title",      pct: 10, check: (p) => !!p.designation },
  { key: "experience", label: "Work Experience",    pct: 10, check: (p) => !!p.experience },
  { key: "skills",     label: "Key Skills",         pct: 10, check: (p) => !!p.skills },
  { key: "cvHeadline", label: "CV Headline",        pct: 5,  check: (p) => !!p.cvHeadline },
  { key: "summary",    label: "Profile Summary",    pct: 5,  check: (p) => !!p.summary },
  { key: "photo",      label: "Profile Photo",      pct: 5,  check: (p) => !!p.profilePhotoPath },
  { key: "resume",     label: "Upload CV",          pct: 20, check: (p) => !!p.resumePath },
  { key: "employment", label: "Employment History", pct: 10, check: (p) => (p.employmentEntries?.length ?? 0) > 0 },
  { key: "education",  label: "Education Details",  pct: 10, check: (p) => (p.educationEntries?.length ?? 0) > 0 },
];

const SECTIONS = [
  { id: "cv-headline",     label: "CV Headline",     incomplete: (p) => !p.cvHeadline },
  { id: "key-skills",      label: "Key Skills",      incomplete: (p) => !p.skills },
  { id: "cv",              label: "CV",              incomplete: (p) => !p.resumePath },
  { id: "professional",    label: "Professional",    incomplete: (p) => !p.designation || !p.experience },
  { id: "employment",      label: "Employment",      incomplete: (p) => (p.employmentEntries?.length ?? 0) === 0 },
  { id: "it-skills",       label: "IT Skills",       incomplete: (p) => !p.itSkills },
  { id: "accomplishments", label: "Accomplishments", incomplete: (p) => (p.certifications?.length ?? 0) === 0 && !p.linkedInUrl },
  { id: "education",       label: "Education",       incomplete: (p) => (p.educationEntries?.length ?? 0) === 0 },
  { id: "profile-summary", label: "Profile Summary", incomplete: (p) => !p.summary },
  { id: "personal",        label: "Personal",        incomplete: (p) => !p.gender || !p.nationality },
  { id: "desired-job",     label: "Desired Job",     incomplete: (p) => !p.desiredJobTitle },
];

function computeCompletion(p) {
  return COMPLETION_ITEMS.reduce((acc, item) => acc + (item.check(p) ? item.pct : 0), 0);
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(month, year) {
  if (!year) return "";
  return month ? `${MONTHS_SHORT[month - 1]} ${year}` : String(year);
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 55 }, (_, i) => currentYear - i);

// ─── Shared card wrapper ──────────────────────────────────────────────────────
function SectionCard({ title, subtitle, adds, editLabel = "Edit", onAdd, onEdit, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ border: "1px solid var(--border-default)" }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[17px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
            {title}
            {adds && (
              <span
                className="ml-2 text-[10px] font-bold rounded-full px-2 py-0.5 align-middle"
                style={{ background: "var(--green-bg)", color: "var(--green)" }}
              >
                ADDS {adds}%
              </span>
            )}
          </h2>
          {subtitle && <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onAdd && (
            <button
              onClick={onAdd}
              className="text-xs font-semibold flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors"
              style={{ color: "var(--accent)", background: "var(--accent-subtle)" }}
            >
              <Plus size={11} /> Add
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs font-semibold flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors"
              style={{ color: "var(--text-secondary)", background: "var(--bg-elev)" }}
            >
              <Pencil size={11} /> {editLabel}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function EditBar({ saving, onCancel }) {
  return (
    <div className="flex gap-2 mt-4">
      <Button size="sm" type="submit" disabled={saving}>
        {saving ? <><Loader2 size={13} className="animate-spin shrink-0" />Saving…</> : "Save"}
      </Button>
      <Button size="sm" variant="secondary" type="button" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
    </div>
  );
}

function EmptyState({ message, onAdd, addLabel = "Add" }) {
  return (
    <button
      className="text-sm flex items-center gap-1.5 font-medium transition-colors"
      style={{ color: "var(--accent)" }}
      onClick={onAdd}
    >
      <Plus size={14} /> {addLabel}
    </button>
  );
}

// ─── CV Headline ──────────────────────────────────────────────────────────────
function CvHeadlineSection({ profile, editing, setEditing, saveSection, savingSection, sectionError }) {
  const sid = "cv-headline";
  const isEditing = editing === sid;
  const [val, setVal] = useState(profile.cvHeadline ?? "");

  useEffect(() => { if (!isEditing) setVal(profile.cvHeadline ?? ""); }, [isEditing, profile.cvHeadline]);

  return (
    <SectionCard
      title="CV Headline"
      subtitle="A short tagline that appears in employer searches."
      onEdit={!isEditing ? () => setEditing(sid) : undefined}
    >
      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); saveSection(sid, { cvHeadline: val }); }}>
          <textarea
            className="field-box w-full resize-none"
            style={{ minHeight: "80px" }}
            placeholder="e.g. Senior Software Engineer specializing in React and Node.js"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            maxLength={200}
            autoFocus
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{val.length}/200</span>
          </div>
          {sectionError[sid] && <p className="text-xs text-red-600 mt-1">{sectionError[sid]}</p>}
          <EditBar saving={savingSection === sid} onCancel={() => setEditing(null)} />
        </form>
      ) : profile.cvHeadline ? (
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{profile.cvHeadline}</p>
      ) : (
        <EmptyState message="" addLabel="Add CV Headline" onAdd={() => setEditing(sid)} />
      )}
    </SectionCard>
  );
}

// ─── Key Skills ───────────────────────────────────────────────────────────────
function KeySkillsSection({ profile, editing, setEditing, saveSection, savingSection, sectionError }) {
  const sid = "key-skills";
  const isEditing = editing === sid;
  const [val, setVal] = useState(profile.skills ?? "");

  useEffect(() => { if (!isEditing) setVal(profile.skills ?? ""); }, [isEditing, profile.skills]);

  const chips = (profile.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <SectionCard
      title="Key Skills"
      onEdit={!isEditing ? () => setEditing(sid) : undefined}
    >
      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); saveSection(sid, { skills: val }); }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
            Enter skills separated by commas
          </p>
          <textarea
            className="field-box w-full resize-none"
            style={{ minHeight: "80px" }}
            placeholder="e.g. JavaScript, React, Node.js, SQL"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            maxLength={1000}
            autoFocus
          />
          {sectionError[sid] && <p className="text-xs text-red-600 mt-1">{sectionError[sid]}</p>}
          <EditBar saving={savingSection === sid} onCancel={() => setEditing(null)} />
        </form>
      ) : chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="text-xs font-semibold rounded-full px-3 py-1.5"
              style={{ background: "var(--purple-bg)", color: "var(--purple-ink)" }}
            >
              {chip}
            </span>
          ))}
        </div>
      ) : (
        <EmptyState addLabel="Add Key Skills" onAdd={() => setEditing(sid)} />
      )}
    </SectionCard>
  );
}

// ─── Professional Details ─────────────────────────────────────────────────────
function ProfessionalSection({ profile, editing, setEditing, saveSection, savingSection, sectionError }) {
  const sid = "professional";
  const isEditing = editing === sid;
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!isEditing) setForm({});
  }, [isEditing]);

  const f = (key) => form[key] ?? profile[key] ?? "";
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const detailItems = [
    { label: "Total Work Experience", value: profile.experience ? `${profile.experience} ${Number(profile.experience) === 1 ? "year" : "years"}` : null },
    { label: "Industry", value: profile.industry },
    { label: "Functional Area", value: profile.functionalArea },
    { label: "Current Salary", value: profile.currentSalary },
  ];

  return (
    <SectionCard
      title="Professional Details"
      onEdit={!isEditing ? () => setEditing(sid) : undefined}
    >
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSection(sid, {
              designation: f("designation"),
              experience: f("experience"),
              industry: f("industry"),
              functionalArea: f("functionalArea"),
              currentSalary: f("currentSalary"),
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="designation"
              label="Current Job Title"
              required
              value={f("designation")}
              onChange={set("designation")}
            />
            <label>
              <span className="field-label">Total Experience (years) <span className="text-red-500">*</span></span>
              <input
                type="number"
                min="0"
                max="60"
                className="field-box"
                value={f("experience")}
                onChange={(e) => setForm((prev) => ({ ...prev, experience: e.target.value.replace(/\D/g, "") }))}
                required
              />
            </label>
            <Select label="Industry" value={f("industry")} onChange={set("industry")} options={INDUSTRIES} placeholder="Select industry" />
            <Input
              id="functionalArea"
              label="Functional Area"
              placeholder="e.g. Software Development"
              value={f("functionalArea")}
              onChange={set("functionalArea")}
            />
            <Input
              id="currentSalary"
              label="Current Salary"
              placeholder="e.g. SAR 15,000/month"
              value={f("currentSalary")}
              onChange={set("currentSalary")}
            />
          </div>
          {sectionError[sid] && <p className="text-xs text-red-600 mt-2">{sectionError[sid]}</p>}
          <EditBar saving={savingSection === sid} onCancel={() => setEditing(null)} />
        </form>
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
          {detailItems.map(({ label, value }) => (
            value ? (
              <div key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
              </div>
            ) : null
          ))}
          {detailItems.every(({ value }) => !value) && (
            <EmptyState addLabel="Add Professional Details" onAdd={() => setEditing(sid)} />
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Employment ───────────────────────────────────────────────────────────────
function EmploymentSection({ profile, onOpenModal, showToast, load }) {
  const entries = profile.employmentEntries ?? [];
  const [deletingId, setDeletingId] = useState(null);

  async function remove(id) {
    if (!confirm("Remove this employment entry?")) return;
    setDeletingId(id);
    try {
      await profileApi.employment.remove(id);
      await load();
      showToast("Employment entry removed");
    } catch {
      showToast("Failed to remove entry");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <SectionCard
      title="Employment Details"
      onAdd={() => onOpenModal(null)}
    >
      {entries.length > 0 ? (
        <div className="grid gap-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex gap-4 rounded-xl p-4"
              style={{ border: "1px solid var(--border-default)" }}
            >
              <div
                className="w-12 h-12 rounded-full grid place-items-center flex-shrink-0"
                style={{ background: "var(--gold-bg)" }}
              >
                <Briefcase size={20} style={{ color: "var(--gold)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{e.jobTitle}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      className="p-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: "var(--text-tertiary)" }}
                      onClick={() => onOpenModal(e)}
                      disabled={deletingId === e.id}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="p-1 rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: "var(--text-tertiary)" }}
                      onClick={() => remove(e.id)}
                      disabled={deletingId === e.id}
                      title="Remove"
                    >
                      {deletingId === e.id ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>{e.companyName}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {fmtDate(e.startMonth, e.startYear)} — {e.isCurrent ? "Present" : fmtDate(e.endMonth, e.endYear)}
                </p>
                {e.description && <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{e.description}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState addLabel="Add Employment" onAdd={() => onOpenModal(null)} />
      )}
    </SectionCard>
  );
}

// ─── IT Skills ────────────────────────────────────────────────────────────────
function ItSkillsSection({ profile, editing, setEditing, saveSection, savingSection, sectionError }) {
  const sid = "it-skills";
  const isEditing = editing === sid;
  const [val, setVal] = useState(profile.itSkills ?? "");

  useEffect(() => { if (!isEditing) setVal(profile.itSkills ?? ""); }, [isEditing, profile.itSkills]);

  const chips = (profile.itSkills ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <SectionCard
      title="IT Skills"
      adds={!profile.itSkills ? 5 : undefined}
      subtitle="Technical tools, platforms, and languages you work with."
      onEdit={!isEditing ? () => setEditing(sid) : undefined}
    >
      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); saveSection(sid, { itSkills: val }); }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>Enter skills separated by commas</p>
          <textarea
            className="field-box w-full resize-none"
            style={{ minHeight: "72px" }}
            placeholder="e.g. Python, AWS, Docker, PostgreSQL, Figma"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            maxLength={1000}
            autoFocus
          />
          {sectionError[sid] && <p className="text-xs text-red-600 mt-1">{sectionError[sid]}</p>}
          <EditBar saving={savingSection === sid} onCancel={() => setEditing(null)} />
        </form>
      ) : chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="text-xs font-semibold rounded-full px-3 py-1.5"
              style={{ background: "var(--teal-bg)", color: "var(--teal-ink)" }}
            >
              {chip}
            </span>
          ))}
        </div>
      ) : (
        <EmptyState addLabel="Add IT Skills" onAdd={() => setEditing(sid)} />
      )}
    </SectionCard>
  );
}

// ─── Accomplishments ──────────────────────────────────────────────────────────
function AccomplishmentsSection({ profile, editing, setEditing, saveSection, savingSection, sectionError, onOpenCertModal, showToast, load }) {
  const sid = "accomplishments-links";
  const isEditing = editing === sid;
  const [form, setForm] = useState({});

  useEffect(() => { if (!isEditing) setForm({}); }, [isEditing]);

  const f = (key) => form[key] ?? profile[key] ?? "";
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const certs = profile.certifications ?? [];

  const [deletingCertId, setDeletingCertId] = useState(null);

  async function removeCert(id) {
    if (!confirm("Remove this certification?")) return;
    setDeletingCertId(id);
    try {
      await profileApi.certifications.remove(id);
      await load();
      showToast("Certification removed");
    } catch {
      showToast("Failed to remove certification");
    } finally {
      setDeletingCertId(null);
    }
  }

  return (
    <SectionCard title="Accomplishments">
      {/* Certifications */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award size={15} style={{ color: "var(--gold)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Certifications</h3>
          </div>
          <button
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: "var(--accent)" }}
            onClick={() => onOpenCertModal(null)}
          >
            <Plus size={11} /> Add
          </button>
        </div>
        {certs.length > 0 ? (
          <div className="grid gap-2">
            {certs.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {[c.issuingOrg, c.issueYear].filter(Boolean).join(" · ")}
                  </p>
                  {c.credentialUrl && (
                    <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-xs mt-0.5 block" style={{ color: "var(--accent)" }}>
                      View credential
                    </a>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    className="p-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: "var(--text-tertiary)" }}
                    onClick={() => onOpenCertModal(c)}
                    disabled={deletingCertId === c.id}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className="p-1 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: "var(--text-tertiary)" }}
                    onClick={() => removeCert(c.id)}
                    disabled={deletingCertId === c.id}
                  >
                    {deletingCertId === c.id ? <Loader2 size={12} className="animate-spin shrink-0" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No certifications added yet.</p>
        )}
      </div>

      {/* Online profiles */}
      <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "16px" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe size={15} style={{ color: "var(--teal-ink)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Online Profiles</h3>
          </div>
          {!isEditing && (
            <button
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setEditing(sid)}
            >
              <Pencil size={11} /> Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSection(sid, {
                linkedInUrl: f("linkedInUrl"),
                githubUrl: f("githubUrl"),
                portfolioUrl: f("portfolioUrl"),
              });
            }}
          >
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Linkedin size={16} style={{ color: "#0077B5", flexShrink: 0 }} />
                <input
                  className="field-box flex-1"
                  placeholder="LinkedIn profile URL"
                  value={f("linkedInUrl")}
                  onChange={set("linkedInUrl")}
                  type="url"
                />
              </div>
              <div className="flex items-center gap-3">
                <Github size={16} style={{ color: "var(--text-primary)", flexShrink: 0 }} />
                <input
                  className="field-box flex-1"
                  placeholder="GitHub profile URL"
                  value={f("githubUrl")}
                  onChange={set("githubUrl")}
                  type="url"
                />
              </div>
              <div className="flex items-center gap-3">
                <Globe size={16} style={{ color: "var(--teal-ink)", flexShrink: 0 }} />
                <input
                  className="field-box flex-1"
                  placeholder="Portfolio or personal website URL"
                  value={f("portfolioUrl")}
                  onChange={set("portfolioUrl")}
                  type="url"
                />
              </div>
            </div>
            {sectionError[sid] && <p className="text-xs text-red-600 mt-1">{sectionError[sid]}</p>}
            <EditBar saving={savingSection === sid} onCancel={() => setEditing(null)} />
          </form>
        ) : (
          <div className="grid gap-2">
            {profile.linkedInUrl && (
              <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium" style={{ color: "#0077B5" }}>
                <Linkedin size={14} /> {profile.linkedInUrl.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            )}
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                <Github size={14} /> {profile.githubUrl.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            )}
            {profile.portfolioUrl && (
              <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--teal-ink)" }}>
                <Globe size={14} /> {profile.portfolioUrl.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            )}
            {!profile.linkedInUrl && !profile.githubUrl && !profile.portfolioUrl && (
              <button
                className="text-sm flex items-center gap-1.5 font-medium"
                style={{ color: "var(--accent)" }}
                onClick={() => setEditing(sid)}
              >
                <Plus size={14} /> Add online profiles
              </button>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────
function EducationSection({ profile, onOpenModal, showToast, load }) {
  const entries = profile.educationEntries ?? [];
  const [deletingId, setDeletingId] = useState(null);

  async function remove(id) {
    if (!confirm("Remove this education entry?")) return;
    setDeletingId(id);
    try {
      await profileApi.education.remove(id);
      await load();
      showToast("Education entry removed");
    } catch {
      showToast("Failed to remove entry");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <SectionCard
      title="Education Details"
      adds={(entries.length === 0) ? 10 : undefined}
      subtitle="Your education details help us suggest suitable job opportunities."
      onAdd={() => onOpenModal(null)}
    >
      {entries.length > 0 ? (
        <div className="grid gap-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex gap-4 rounded-xl p-4"
              style={{ border: "1px solid var(--border-default)" }}
            >
              <div
                className="w-12 h-12 rounded-full grid place-items-center flex-shrink-0"
                style={{ background: "var(--purple-bg)" }}
              >
                <GraduationCap size={20} style={{ color: "var(--purple-ink)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{e.degree}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      className="p-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: "var(--text-tertiary)" }}
                      onClick={() => onOpenModal(e)}
                      disabled={deletingId === e.id}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="p-1 rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: "var(--text-tertiary)" }}
                      onClick={() => remove(e.id)}
                      disabled={deletingId === e.id}
                      title="Remove"
                    >
                      {deletingId === e.id ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>{e.institution}</p>
                {e.fieldOfStudy && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{e.fieldOfStudy}</p>}
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {e.startYear ?? ""}
                  {(e.startYear && (e.endYear || e.isCurrent)) ? " — " : ""}
                  {e.isCurrent ? "Present" : (e.endYear ?? "")}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState addLabel="Add Education" onAdd={() => onOpenModal(null)} />
      )}
    </SectionCard>
  );
}

// ─── Profile Summary ──────────────────────────────────────────────────────────
function ProfileSummarySection({ profile, editing, setEditing, saveSection, savingSection, sectionError }) {
  const sid = "profile-summary";
  const isEditing = editing === sid;
  const [val, setVal] = useState(profile.summary ?? "");

  useEffect(() => { if (!isEditing) setVal(profile.summary ?? ""); }, [isEditing, profile.summary]);

  return (
    <SectionCard
      title="Profile Summary"
      adds={!profile.summary ? 5 : undefined}
      subtitle="Outline key highlights of your career to employers."
      onEdit={!isEditing ? () => setEditing(sid) : undefined}
    >
      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); saveSection(sid, { summary: val }); }}>
          <textarea
            className="field-box w-full resize-y"
            style={{ minHeight: "120px" }}
            placeholder="Write a brief professional summary…"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            maxLength={2000}
            autoFocus
          />
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{val.length}/2000</span>
          {sectionError[sid] && <p className="text-xs text-red-600 mt-1">{sectionError[sid]}</p>}
          <EditBar saving={savingSection === sid} onCancel={() => setEditing(null)} />
        </form>
      ) : profile.summary ? (
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-primary)" }}>{profile.summary}</p>
      ) : (
        <EmptyState addLabel="Add Profile Summary" onAdd={() => setEditing(sid)} />
      )}
    </SectionCard>
  );
}

// ─── Personal Details ─────────────────────────────────────────────────────────
// Fixed dropdowns / date picker — rendered as explicit controlled fields rather
// than the generic free-text loop below, so their values stay enum-valid.
const STRUCTURED_PERSONAL = [
  { key: "dateOfBirth",   label: "Date of Birth" },
  { key: "maritalStatus", label: "Marital Status" },
  { key: "visaStatus",    label: "Work Authorization" },
];

const OPTIONAL_PERSONAL = [
  { key: "drivingLicense",label: "Driving License",                 placeholder: "e.g. Saudi, UAE, International" },
  { key: "languagesKnown",label: "Languages Known",                 placeholder: "e.g. Arabic, English, Urdu" },
  { key: "religion",      label: "Religion",                        placeholder: "e.g. Islam, Christianity" },
  { key: "alternateEmail",label: "Alternate Email Address",         placeholder: "another@email.com" },
  { key: "alternateMobile",label: "Alternate Contact ",       placeholder: "+966XXXXXXXXX", labelHint: "enter number with country code" },
];

function fmtDob(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

function PersonalSection({ profile, editing, setEditing, saveSection, savingSection, sectionError }) {
  const sid = "personal";
  const isEditing = editing === sid;
  const [form, setForm] = useState({});
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { if (!isEditing) setForm({}); }, [isEditing]);

  const f = (key) => form[key] ?? profile[key] ?? "";
  const set = (key) => (e) => {
    let val = e.target.value;
    if ((key === "mobile" || key === "alternateMobile") && val !== "" && !val.startsWith("+")) val = "+";
    setForm((prev) => ({ ...prev, [key]: val }));
  };
  // Clearing the country invalidates whatever city was paired with it.
  const setCountry = (e) => setForm((prev) => ({ ...prev, country: e.target.value, ...(e.target.value ? {} : { city: "" }) }));

  const ALL_OPTIONAL = [...STRUCTURED_PERSONAL, ...OPTIONAL_PERSONAL];
  const filledOptional = ALL_OPTIONAL.filter(({ key }) => !!profile[key]);
  const emptyOptional = ALL_OPTIONAL.filter(({ key }) => !profile[key]);
  const displayValue = (key, value) => (key === "dateOfBirth" ? fmtDob(value) : value);

  return (
    <SectionCard
      title="Personal Details"
      onEdit={!isEditing ? () => setEditing(sid) : undefined}
    >
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSection(sid, {
              mobile: f("mobile"),
              country: f("country"),
              city: f("country") ? f("city") : "",
              gender: f("gender"),
              nationality: f("nationality"),
              dateOfBirth: f("dateOfBirth"),
              maritalStatus: f("maritalStatus"),
              drivingLicense: f("drivingLicense"),
              languagesKnown: f("languagesKnown"),
              visaStatus: f("visaStatus"),
              religion: f("religion"),
              alternateEmail: f("alternateEmail"),
              alternateMobile: f("alternateMobile"),
            });
          }}
        >
          {/* Core fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="mobile-p" label="Mobile Number" labelHint="enter number with country code" required value={f("mobile")} onChange={set("mobile")} placeholder="+966XXXXXXXXX" />
            <Select
              label="Gender"
              value={f("gender")}
              onChange={set("gender")}
              options={["Male", "Female", "Prefer not to say"]}
              placeholder="Select gender"
            />
            <Combobox
              id="country-p"
              label="Country"
              required
              value={f("country")}
              onChange={setCountry}
              options={COUNTRIES}
              placeholder="Select country"
              searchPlaceholder="Search countries…"
            />
            <Input
              id="city-p"
              label="City"
              placeholder={f("country") ? "e.g. Riyadh" : "Select a country first"}
              value={f("city")}
              onChange={set("city")}
              disabled={!f("country")}
              maxLength={100}
            />
            <Input id="nationality-p" label="Nationality" placeholder="e.g. Saudi, Indian, Pakistani" value={f("nationality")} onChange={set("nationality")} />
          </div>

          {/* Optional fields */}
          <p className="mt-5 mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Additional Details (optional)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="dob-p" label="Date of Birth" type="date" max={today} value={f("dateOfBirth")} onChange={set("dateOfBirth")} />
            <Select
              label="Marital Status"
              value={f("maritalStatus")}
              onChange={set("maritalStatus")}
              options={MARITAL_STATUS_OPTIONS}
              placeholder="Select marital status"
            />
            <div className="sm:col-span-2">
              <Select
                label="Are you authorised to work in Saudi Arabia?"
                value={f("visaStatus")}
                onChange={set("visaStatus")}
                options={WORK_AUTHORIZATION_OPTIONS}
                placeholder="Select an option"
              />
            </div>
            {OPTIONAL_PERSONAL.map(({ key, label, placeholder, labelHint }) => (
              <Input key={key} label={label} labelHint={labelHint} placeholder={placeholder} value={f(key)} onChange={set(key)} />
            ))}
          </div>

          {sectionError[sid] && <p className="text-xs text-red-600 mt-2">{sectionError[sid]}</p>}
          <EditBar saving={savingSection === sid} onCancel={() => setEditing(null)} />
        </form>
      ) : (
        <>
          {/* Core filled values */}
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
            {[
              { label: "Full Name", value: profile.name },
              { label: "Email", value: profile.email },
              { label: "Mobile", value: profile.mobile },
              { label: "Location", value: [profile.city, profile.country].filter(Boolean).join(", ") || null },
              { label: "Gender", value: profile.gender },
              { label: "Nationality", value: profile.nationality },
              ...filledOptional.map(({ key, label }) => ({ label, value: displayValue(key, profile[key]) })),
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
                </div>
              ) : null,
            )}
          </div>

          {/* Empty optional fields as "+ Add" hints */}
          {emptyOptional.length > 0 && (
            <div className="mt-4 pt-4 grid sm:grid-cols-2 gap-2" style={{ borderTop: "1px solid var(--border-default)" }}>
              {emptyOptional.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setEditing(sid)}
                  className="text-[12px] font-medium text-left flex items-center gap-1.5 transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  <Plus size={12} /> Add {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}

// ─── Desired Job ──────────────────────────────────────────────────────────────
function DesiredJobSection({ profile, editing, setEditing, saveSection, savingSection, sectionError }) {
  const sid = "desired-job";
  const isEditing = editing === sid;
  const [form, setForm] = useState({});

  useEffect(() => { if (!isEditing) setForm({}); }, [isEditing]);

  const f = (key) => form[key] ?? profile[key] ?? "";
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const items = [
    { label: "Desired Job Title", value: profile.desiredJobTitle },
    { label: "Preferred Location", value: profile.desiredLocation },
    { label: "Availability to Join", value: profile.availabilityToJoin },
  ];

  return (
    <SectionCard
      title="Desired Job"
      adds={!profile.desiredJobTitle ? 6 : undefined}
      subtitle="Help us match you with jobs you wish to do."
      onEdit={!isEditing ? () => setEditing(sid) : undefined}
    >
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSection(sid, {
              desiredJobTitle: f("desiredJobTitle"),
              desiredLocation: f("desiredLocation"),
              availabilityToJoin: f("availabilityToJoin"),
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="desiredJobTitle"
              label="Desired Job Title"
              placeholder="e.g. Senior Product Manager"
              value={f("desiredJobTitle")}
              onChange={set("desiredJobTitle")}
            />
            <Input
              id="desiredLocation"
              label="Preferred Location"
              placeholder="e.g. Riyadh, Remote"
              value={f("desiredLocation")}
              onChange={set("desiredLocation")}
            />
            <Select
              label="Availability to Join"
              value={f("availabilityToJoin")}
              onChange={set("availabilityToJoin")}
              options={AVAILABILITY_OPTIONS}
              placeholder="Select availability"
            />
          </div>
          {sectionError[sid] && <p className="text-xs text-red-600 mt-2">{sectionError[sid]}</p>}
          <EditBar saving={savingSection === sid} onCancel={() => setEditing(null)} />
        </form>
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
          {items.map(({ label, value }) =>
            value ? (
              <div key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
              </div>
            ) : null,
          )}
          {items.every(({ value }) => !value) && (
            <EmptyState addLabel="Add Desired Job" onAdd={() => setEditing(sid)} />
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── CV Section ───────────────────────────────────────────────────────────────
function CvSection({ profile, onUpload, onDownload, resumeUploading, showToast, load }) {
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!confirm("Remove your CV?")) return;
    setDeleting(true);
    try {
      await profileApi.deleteResume();
      await load();
      showToast("CV removed");
    } catch {
      showToast("Failed to remove CV");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SectionCard
      title="Update CV"
      subtitle="An updated CV increases your chances of getting interview calls by 60%."
    >
      {profile.resumeFilename ? (
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-4"
          style={{ border: "1px solid var(--border-default)" }}
        >
          <div
            className="w-20 h-20 rounded-xl flex-shrink-0 p-3"
            style={{ background: "white", border: "1px solid var(--border-default)" }}
          >
            <div className="grid gap-1.5 h-full">
              <span className="h-1.5 rounded-full" style={{ background: "var(--accent)", width: "65%" }} />
              <span className="h-1.5 rounded-full" style={{ background: "var(--bg-elev)" }} />
              <span className="h-1.5 rounded-full" style={{ background: "var(--bg-elev)", width: "80%" }} />
              <span className="h-1.5 rounded-full" style={{ background: "var(--bg-elev)", width: "60%" }} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{profile.resumeFilename}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Last updated {new Date(profile.resumeUploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={onDownload}>
              <Download size={13} /> Download
            </Button>
            <label className={`btn-secondary btn-sm cursor-pointer${resumeUploading ? " opacity-50 cursor-not-allowed" : ""}`}>
              {resumeUploading ? <><Loader2 size={13} className="animate-spin shrink-0" />Uploading…</> : "Replace"}
              <input className="sr-only" type="file" accept=".pdf,.doc,.docx" disabled={resumeUploading} onChange={onUpload} />
            </label>
            <Button size="sm" variant="danger" onClick={remove} disabled={deleting}>
              {deleting
                ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Trash2 size={13} />}
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-8 rounded-xl"
          style={{ border: "2px dashed var(--border-default)" }}
        >
          <FileText size={32} style={{ color: "var(--text-tertiary)" }} className="mb-3" />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>No CV uploaded yet</p>
          <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>PDF, DOC or DOCX — max 5 MB</p>
          <label className={`btn-primary text-sm cursor-pointer${resumeUploading ? " opacity-50 cursor-not-allowed" : ""}`}>
            {resumeUploading ? <Loader2 size={14} className="animate-spin shrink-0" /> : <FileText size={14} />}
            {resumeUploading ? "Uploading…" : "Upload CV"}
            <input className="sr-only" type="file" accept=".pdf,.doc,.docx" disabled={resumeUploading} onChange={onUpload} />
          </label>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Employment Modal ─────────────────────────────────────────────────────────
function EmploymentModal({ entry, onClose, onSave }) {
  const isEdit = !!entry?.id;
  const [form, setForm] = useState({
    jobTitle: entry?.jobTitle ?? "",
    companyName: entry?.companyName ?? "",
    startMonth: entry?.startMonth ?? "",
    startYear: entry?.startYear ?? "",
    endMonth: entry?.endMonth ?? "",
    endYear: entry?.endYear ?? "",
    isCurrent: entry?.isCurrent ?? false,
    description: entry?.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key) { return (e) => setForm((p) => ({ ...p, [key]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        jobTitle: form.jobTitle.trim(),
        companyName: form.companyName.trim(),
        startYear: Number(form.startYear),
        startMonth: form.startMonth ? Number(form.startMonth) : null,
        isCurrent: form.isCurrent,
        endYear: form.isCurrent || !form.endYear ? null : Number(form.endYear),
        endMonth: form.isCurrent || !form.endMonth ? null : Number(form.endMonth),
        description: form.description.trim() || undefined,
      };
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save");
      setSaving(false);
    }
  }

  return (
    <Modal isOpen title={isEdit ? "Edit Employment" : "Add Employment"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <Input label="Job Title" required value={form.jobTitle} onChange={set("jobTitle")} />
        <Input label="Company Name" required value={form.companyName} onChange={set("companyName")} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Start Month" value={form.startMonth} onChange={set("startMonth")} options={MONTHS_LONG.map((m, i) => ({ value: i + 1, label: m }))} placeholder="Month" />
          <Select label="Start Year" required value={form.startYear} onChange={set("startYear")} options={YEARS} placeholder="Year" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isCurrent}
            onChange={(e) => setForm((p) => ({ ...p, isCurrent: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>I currently work here</span>
        </label>
        {!form.isCurrent && (
          <div className="grid grid-cols-2 gap-3">
            <Select label="End Month" value={form.endMonth} onChange={set("endMonth")} options={MONTHS_LONG.map((m, i) => ({ value: i + 1, label: m }))} placeholder="Month" />
            <Select label="End Year" value={form.endYear} onChange={set("endYear")} options={YEARS} placeholder="Year" />
          </div>
        )}
        <label>
          <span className="field-label">Description (optional)</span>
          <textarea
            className="field-box w-full resize-none"
            style={{ minHeight: "80px" }}
            placeholder="Key responsibilities or achievements…"
            value={form.description}
            onChange={set("description")}
            maxLength={2000}
          />
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Education Modal ──────────────────────────────────────────────────────────
function EducationModal({ entry, onClose, onSave }) {
  const isEdit = !!entry?.id;
  const [form, setForm] = useState({
    degree: entry?.degree ?? "",
    institution: entry?.institution ?? "",
    fieldOfStudy: entry?.fieldOfStudy ?? "",
    startYear: entry?.startYear ?? "",
    endYear: entry?.endYear ?? "",
    isCurrent: entry?.isCurrent ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key) { return (e) => setForm((p) => ({ ...p, [key]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        degree: form.degree.trim(),
        institution: form.institution.trim(),
        fieldOfStudy: form.fieldOfStudy.trim() || undefined,
        startYear: form.startYear ? Number(form.startYear) : null,
        endYear: form.isCurrent || !form.endYear ? null : Number(form.endYear),
        isCurrent: form.isCurrent,
      };
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save");
      setSaving(false);
    }
  }

  return (
    <Modal isOpen title={isEdit ? "Edit Education" : "Add Education"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <Input label="Degree / Qualification" required placeholder="e.g. Bachelor of Science" value={form.degree} onChange={set("degree")} />
        <Input label="Institution" required placeholder="e.g. King Abdulaziz University" value={form.institution} onChange={set("institution")} />
        <Input label="Field of Study (optional)" placeholder="e.g. Computer Science" value={form.fieldOfStudy} onChange={set("fieldOfStudy")} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Start Year" value={form.startYear} onChange={set("startYear")} options={YEARS} placeholder="Year" />
          <Select label="End Year" value={form.endYear} onChange={set("endYear")} options={YEARS} placeholder="Year" disabled={form.isCurrent} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isCurrent}
            onChange={(e) => setForm((p) => ({ ...p, isCurrent: e.target.checked, endYear: e.target.checked ? "" : p.endYear }))}
          />
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Currently studying here</span>
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Certification Modal ──────────────────────────────────────────────────────
function CertificationModal({ entry, onClose, onSave }) {
  const isEdit = !!entry?.id;
  const [form, setForm] = useState({
    name: entry?.name ?? "",
    issuingOrg: entry?.issuingOrg ?? "",
    issueYear: entry?.issueYear ?? "",
    credentialUrl: entry?.credentialUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key) { return (e) => setForm((p) => ({ ...p, [key]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        issuingOrg: form.issuingOrg.trim() || undefined,
        issueYear: form.issueYear ? Number(form.issueYear) : null,
        credentialUrl: form.credentialUrl.trim() || undefined,
      };
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save");
      setSaving(false);
    }
  }

  return (
    <Modal isOpen title={isEdit ? "Edit Certification" : "Add Certification"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <Input label="Certification Name" required placeholder="e.g. AWS Solutions Architect" value={form.name} onChange={set("name")} />
        <Input label="Issuing Organization (optional)" placeholder="e.g. Amazon Web Services" value={form.issuingOrg} onChange={set("issuingOrg")} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Issue Year" value={form.issueYear} onChange={set("issueYear")} options={YEARS} placeholder="Year" />
        </div>
        <Input label="Credential URL (optional)" placeholder="https://…" type="url" value={form.credentialUrl} onChange={set("credentialUrl")} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState("cv-headline");
  const [savingSection, setSavingSection] = useState(null);
  const [sectionError, setSectionError] = useState({});
  const [photoUploading, setPhotoUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [nameEdit, setNameEdit] = useState({ open: false, value: "", saving: false });
  const sectionRefs = useRef({});

  const load = useCallback(async () => {
    const { data } = await profileApi.get();
    setProfile(data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!profile) return;
    const handler = () => {
      const threshold = window.scrollY + 220;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = sectionRefs.current[s.id];
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (top <= threshold) current = s.id;
        }
      }
      setActiveTab(current);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [profile]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function saveSection(sectionId, payload) {
    setSavingSection(sectionId);
    setSectionError((prev) => ({ ...prev, [sectionId]: null }));
    try {
      await profileApi.update(payload);
      await load();
      setEditing(null);
      showToast("Saved successfully");
    } catch (e) {
      setSectionError((prev) => ({ ...prev, [sectionId]: e.response?.data?.message ?? "Failed to save" }));
    } finally {
      setSavingSection(null);
    }
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      await profileApi.uploadPhoto(file);
      await load();
      showToast("Profile photo updated");
    } catch (e) {
      showToast(e.response?.data?.message ?? "Photo upload failed");
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  }

  async function uploadResume(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    try {
      const { data } = await profileApi.uploadResume(file);
      const parsed = data.data?.parsedFields ?? {};
      await load();
      const filled = Object.values(parsed).filter(Boolean).length;
      showToast(filled > 0 ? `Resume uploaded — ${filled} fields pre-filled` : "Resume uploaded");
    } catch (e) {
      showToast(e.response?.data?.message ?? "Resume upload failed");
    } finally {
      setResumeUploading(false);
      event.target.value = "";
    }
  }

  async function downloadResume() {
    try {
      const { data } = await profileApi.downloadResume();
      window.location.assign(data.data.url);
    } catch {
      showToast("Could not generate download link");
    }
  }

  async function saveName() {
    const trimmed = nameEdit.value.trim();
    if (!trimmed || trimmed === (profile.displayName ?? "")) { setNameEdit({ open: false, value: "", saving: false }); return; }
    setNameEdit((s) => ({ ...s, saving: true }));
    try {
      await profileApi.update({ displayName: trimmed });
      await load();
      showToast("Display name updated");
      setNameEdit({ open: false, value: "", saving: false });
    } catch {
      showToast("Failed to update display name");
      setNameEdit((s) => ({ ...s, saving: false }));
    }
  }

  if (!profile) {
    return <div className="grid min-h-96 place-items-center"><Spinner label="Loading profile" /></div>;
  }

  const completion = computeCompletion(profile);
  const pending = COMPLETION_ITEMS.filter((item) => !item.check(profile));

  const shared = { profile, editing, setEditing, saveSection, savingSection, sectionError, setSectionError, load, showToast };

  return (
    <>
      {/* Hero banner */}
      <section
        className="-mt-6 sm:-mt-10 relative overflow-hidden"
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          height: "176px",
          background: "linear-gradient(135deg, #C62828 0%, var(--accent) 45%, #EF5350 100%)",
          borderBottomLeftRadius: "72px",
        }}
      >
        <div className="absolute rounded-full" style={{ width: 260, height: 260, right: "15%", top: -120, background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute rounded-full" style={{ width: 180, height: 180, left: "10%", bottom: -90, background: "rgba(255,255,255,0.08)" }} />
      </section>

      {/* Content - overlaps hero */}
      <div className="relative z-10" style={{ marginTop: "-104px" }}>

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-lg" style={{ border: "1px solid var(--border-default)", padding: "24px" }}>
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Identity */}
            <div className="flex gap-5 items-start">
              <div className="relative flex-shrink-0">
                {profile.profilePhotoUrl ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full object-cover"
                    style={{ border: "5px solid #fff", boxShadow: "0 2px 12px rgba(20,20,20,0.14)" }}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full grid place-items-center font-bold text-3xl"
                    style={{
                      background: "var(--accent-subtle)",
                      color: "var(--accent)",
                      border: "5px solid #fff",
                      boxShadow: "0 2px 12px rgba(20,20,20,0.14)",
                    }}
                  >
                    {initials(profile.name)}
                  </div>
                )}
                <label
                  className="absolute grid place-items-center cursor-pointer rounded-full"
                  style={{ width: 30, height: 30, bottom: 2, right: 0, background: "var(--accent)", color: "#fff" }}
                  title="Change photo"
                >
                  {photoUploading
                    ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <Camera size={12} />}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={photoUploading} onChange={uploadPhoto} />
                </label>
              </div>

              <div className="min-w-0 flex-1 pt-2">
                {nameEdit.open ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      autoFocus
                      value={nameEdit.value}
                      onChange={(e) => setNameEdit((s) => ({ ...s, value: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setNameEdit({ open: false, value: "", saving: false }); }}
                      className="text-xl font-bold rounded-lg px-2 py-1 w-full max-w-xs"
                      style={{ border: "2px solid var(--accent)", outline: "none", fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                      disabled={nameEdit.saving}
                    />
                    <button
                      onClick={saveName}
                      disabled={nameEdit.saving}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5"
                      style={{ background: "var(--accent)" }}
                    >
                      {nameEdit.saving ? <><Loader2 size={12} className="animate-spin shrink-0" />Saving…</> : "Save"}
                    </button>
                    <button
                      onClick={() => setNameEdit({ open: false, value: "", saving: false })}
                      disabled={nameEdit.saving}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1
                      className="text-2xl font-bold tracking-tight"
                      style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                    >
                      {profile.name?.toUpperCase()}
                    </h1>
                    <button
                      onClick={() => setNameEdit({ open: true, value: profile.displayName ?? "", saving: false })}
                      className="p-1 rounded-md transition-colors hover:bg-white/20"
                      style={{ color: "var(--text-tertiary)" }}
                      title="Edit display name (shown on profile; does not change your login name)"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
                {profile.designation && (
                  <p className="mt-1.5 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {profile.designation}{profile.industry ? ` · ${profile.industry}` : ""}
                  </p>
                )}
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                  {(profile.city || profile.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />{[profile.city, profile.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {profile.email && <span className="flex items-center gap-1">✉ {profile.email}</span>}
                  {profile.mobile && <span className="flex items-center gap-1"><Phone size={12} />{profile.mobile}</span>}
                </div>
              </div>
            </div>

            {/* Profile strength */}
            <div
              className="flex gap-3 rounded-xl p-4 items-start"
              style={{ background: "var(--gold-bg)", border: "1px solid rgba(217,153,43,0.25)" }}
            >
              <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 bg-white" style={{ boxShadow: "0 1px 4px rgba(20,20,20,0.08)" }}>
                <Target size={18} style={{ color: "var(--gold)" }} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                  Profile strength: {completion}%
                </h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--gold-ink)" }}>
                  {completion < 60
                    ? "Complete your profile to appear in employer searches."
                    : completion < 85
                    ? "Great progress! A few more details will boost your visibility."
                    : "Your profile is looking strong. Keep it up to date!"}
                </p>
                {pending.length > 0 && (
                  <span
                    className="text-[11px] font-bold rounded-full px-2.5 py-1"
                    style={{ background: "var(--gold)", color: "#fff" }}
                  >
                    {pending.length} actions pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <nav
          className="sticky z-40 mt-4 bg-white rounded-2xl overflow-x-auto flex gap-2"
          style={{ top: "64px", border: "1px solid var(--border-default)", padding: "8px 10px", scrollbarWidth: "none" }}
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveTab(s.id)}
              className="relative whitespace-nowrap text-xs font-bold px-3 py-2 rounded-full transition-colors"
              style={{
                color: activeTab === s.id ? "var(--accent)" : "var(--text-secondary)",
                background: activeTab === s.id ? "var(--accent-subtle)" : "transparent",
              }}
            >
              {s.label}
              {s.incomplete(profile) && (
                <span
                  className="absolute top-2 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </a>
          ))}
        </nav>

        {/* Page grid */}
        <div className="grid lg:grid-cols-[290px_1fr] gap-5 mt-5 pb-20 items-start">

          {/* Completion sidebar */}
          <aside className="lg:sticky" style={{ top: "136px" }}>
            <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid var(--border-default)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-4xl font-bold tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>{completion}%</p>
                  <p className="text-sm font-bold mt-1" style={{ color: "var(--text-primary)" }}>Profile Complete</p>
                </div>
                <span className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>

              <div className="h-2 rounded-full overflow-hidden my-4" style={{ background: "var(--bg-elev)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${completion}%`, background: completion >= 80 ? "var(--green)" : "var(--gold)" }}
                />
              </div>

              {pending.length > 0 && (
                <>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{pending.length} Pending Actions</p>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                    Complete these to reach 100% and get discovered faster.
                  </p>
                  <div className="grid gap-2.5">
                    {pending.slice(0, 6).map((item) => (
                      <div key={item.key} className="flex gap-3 p-3 rounded-xl" style={{ border: "1px solid var(--border-default)" }}>
                        <div className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background: "var(--bg-elev)" }}>
                          <span className="text-sm">📌</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                          <div className="mt-1.5">
                            <span
                              className="text-[10px] font-bold rounded-full px-2 py-0.5"
                              style={{ background: "var(--green-bg)", color: "var(--green)" }}
                            >
                              ADDS {item.pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* Sections */}
          <div className="grid gap-4">
            <div ref={(el) => { sectionRefs.current["cv-headline"] = el; }} id="cv-headline">
              <CvHeadlineSection {...shared} />
            </div>

            <div ref={(el) => { sectionRefs.current["key-skills"] = el; }} id="key-skills">
              <KeySkillsSection {...shared} />
            </div>

            <div ref={(el) => { sectionRefs.current["cv"] = el; }} id="cv">
              <CvSection
                profile={profile}
                load={load}
                showToast={showToast}
                onUpload={uploadResume}
                onDownload={downloadResume}
                resumeUploading={resumeUploading}
              />
            </div>

            <div ref={(el) => { sectionRefs.current["professional"] = el; }} id="professional">
              <ProfessionalSection {...shared} />
            </div>

            <div ref={(el) => { sectionRefs.current["employment"] = el; }} id="employment">
              <EmploymentSection
                profile={profile}
                load={load}
                showToast={showToast}
                onOpenModal={(entry) => setModal({ type: "emp", entry })}
              />
            </div>

            <div ref={(el) => { sectionRefs.current["it-skills"] = el; }} id="it-skills">
              <ItSkillsSection {...shared} />
            </div>

            <div ref={(el) => { sectionRefs.current["accomplishments"] = el; }} id="accomplishments">
              <AccomplishmentsSection
                {...shared}
                onOpenCertModal={(entry) => setModal({ type: "cert", entry })}
              />
            </div>

            <div ref={(el) => { sectionRefs.current["education"] = el; }} id="education">
              <EducationSection
                profile={profile}
                load={load}
                showToast={showToast}
                onOpenModal={(entry) => setModal({ type: "edu", entry })}
              />
            </div>

            <div ref={(el) => { sectionRefs.current["profile-summary"] = el; }} id="profile-summary">
              <ProfileSummarySection {...shared} />
            </div>

            <div ref={(el) => { sectionRefs.current["personal"] = el; }} id="personal">
              <PersonalSection {...shared} />
            </div>

            <div ref={(el) => { sectionRefs.current["desired-job"] = el; }} id="desired-job">
              <DesiredJobSection {...shared} />
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full text-sm font-semibold text-white shadow-lg pointer-events-none"
          style={{ background: "#172B3A" }}
        >
          {toast}
        </div>
      )}

      {/* Employment modal */}
      {modal?.type === "emp" && (
        <EmploymentModal
          entry={modal.entry}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal.entry?.id) {
              await profileApi.employment.update(modal.entry.id, data);
            } else {
              await profileApi.employment.add(data);
            }
            await load();
            setModal(null);
            showToast("Employment entry saved");
          }}
        />
      )}

      {/* Education modal */}
      {modal?.type === "edu" && (
        <EducationModal
          entry={modal.entry}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal.entry?.id) {
              await profileApi.education.update(modal.entry.id, data);
            } else {
              await profileApi.education.add(data);
            }
            await load();
            setModal(null);
            showToast("Education entry saved");
          }}
        />
      )}

      {/* Certification modal */}
      {modal?.type === "cert" && (
        <CertificationModal
          entry={modal.entry}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal.entry?.id) {
              await profileApi.certifications.update(modal.entry.id, data);
            } else {
              await profileApi.certifications.add(data);
            }
            await load();
            setModal(null);
            showToast("Certification saved");
          }}
        />
      )}
    </>
  );
}
