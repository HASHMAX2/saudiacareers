import { Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Download, Loader2, SlidersHorizontal } from "lucide-react";
import { employerApi } from "../../api/employer.js";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Select } from "../../components/common/Select.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const EMP = "var(--accent)";
const EMP_SUBTLE = "var(--accent-subtle)";

const STATUS_OPTIONS = ["APPLIED", "SELECTED", "REJECTED"];

// SHORTLISTED/ON_HOLD are kept here only so a pre-existing application still
// gets a readable badge label instead of a raw enum string — the employer
// can no longer set either status; there's no button for them anymore.
const STATUS_META = {
  APPLIED:      { label: "New",         tone: "blue"  },
  SHORTLISTED:  { label: "Shortlisted", tone: "green" },
  ON_HOLD:      { label: "On hold",     tone: "amber" },
  UNDER_REVIEW: { label: "Under review",tone: "amber" },
  SELECTED:     { label: "Selected",    tone: "green" },
  REJECTED:     { label: "Rejected",    tone: "red"   },
};

function initialsOf(name) {
  return (name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function EmployerApplications() {
  const { id: jobId } = useParams();
  const [job, setJob]               = useState(null);
  const [applications, setApps]     = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [busyId, setBusyId]         = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [downloadingId, setDlId]    = useState(null);
  const [expandedId, setExpandedId]       = useState(null);
  const [profileCache, setProfileCache]   = useState({});
  const [loadingProfileId, setLoadingPId] = useState(null);

  async function load(p = page, q = search, st = statusFilter) {
    setLoading(true);
    try {
      const { data } = await employerApi.getJobApplications(jobId, {
        page: p, limit: 20,
        ...(q  ? { search: q } : {}),
        ...(st ? { status: st } : {}),
      });
      setJob(data.data.job);
      setApps(data.data.applications);
      setTotal(data.data.pagination.total);
      setTotalPages(data.data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatus(appId, status) {
    setBusyId(appId);
    setBusyAction(status);
    try {
      const { data } = await employerApi.updateAppStatus(appId, { status });
      const updatedStatus = data.data.status;
      if (statusFilter && statusFilter !== updatedStatus) {
        // No longer matches the active status filter — drop it from view instead
        // of reloading the whole table (which would blow away scroll position,
        // the expanded profile panel, and flash a full-page spinner).
        setApps((prev) => prev.filter((a) => a.id !== appId));
        setTotal((t) => Math.max(0, t - 1));
      } else {
        setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status: updatedStatus } : a)));
      }
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function handleDownload(app) {
    if (!app.user.profile?.resumePath) return;
    setDlId(app.id);
    try {
      const { data } = await employerApi.getApplication(app.id);
      if (data.data.resumeUrl) window.open(data.data.resumeUrl, "_blank");
    } finally {
      setDlId(null);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    load(1, search, statusFilter);
  }

  async function toggleProfile(app) {
    if (expandedId === app.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(app.id);
    if (profileCache[app.id]) return;
    setLoadingPId(app.id);
    try {
      const { data } = await employerApi.getApplication(app.id);
      setProfileCache((prev) => ({ ...prev, [app.id]: data.data }));
    } finally {
      setLoadingPId(null);
    }
  }

  const initialLoading = loading && !job;

  return (
    <div>
      <Link to="/employer/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft size={14} />Back to listings
      </Link>
      {initialLoading ? (
        <>
          <div className="h-9 w-72 max-w-full animate-pulse rounded-lg" style={{ background: "rgba(0,0,0,0.08)" }} />
          <div className="mt-2 mb-6 h-4 w-24 animate-pulse rounded" style={{ background: "rgba(0,0,0,0.08)" }} />
        </>
      ) : (
        <>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>{job?.title ?? "Job not found"}</h1>
          <p className="mt-1 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
            {total} applicant{total !== 1 ? "s" : ""}
          </p>
        </>
      )}

      {!initialLoading && (
        <form onSubmit={handleSearch} className="mb-5 flex flex-wrap gap-2">
          <input
            className="min-w-40 flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
            style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
            placeholder="Search candidate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            className="w-44"
            pill
            icon={SlidersHorizontal}
            value={statusFilter}
            onChange={(e) => { setStatus(e.target.value); setPage(1); load(1, search, e.target.value); }}
            options={[{ value: "", label: "All stages" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_META[s]?.label ?? s }))]}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      )}

      {initialLoading || loading ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading applications" /></div>
      ) : !applications.length ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No applications yet.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
            <table className="w-full text-left text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  {["Candidate", "Status", "Applied", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${h === "Actions" ? "text-right pr-5" : ""}`}
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((app, i) => (
                  <Fragment key={app.id}>
                    <tr style={{ borderTop: i ? "1px solid var(--border-default)" : "none", background: "var(--bg-white)" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold" style={{ background: EMP_SUBTLE, color: EMP }}>
                            {initialsOf(app.user.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{app.user.name}</p>
                            <p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
                              {[app.user.profile?.designation, app.user.profile?.experience, [app.user.profile?.city, app.user.profile?.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || app.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_META[app.status]?.tone ?? "blue"}>{STATUS_META[app.status]?.label ?? app.status}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(app.appliedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Button size="xs" className="min-w-[102px]" variant="secondary" onClick={() => toggleProfile(app)}>
                            {loadingProfileId === app.id
                              ? <Loader2 size={12} className="animate-spin shrink-0" />
                              : expandedId === app.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {expandedId === app.id ? "Hide profile" : "View profile"}
                          </Button>
                          {app.user.profile?.resumePath && (
                            <Button size="xs" className="min-w-[102px]" variant="secondary" disabled={!!busyId || downloadingId === app.id} onClick={() => handleDownload(app)}>
                              {downloadingId === app.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                              Resume
                            </Button>
                          )}
                          {STATUS_OPTIONS.filter((s) => s !== app.status).map((s) => (
                            <Button
                              key={s}
                              size="xs"
                              className="min-w-[102px]"
                              variant={s === "REJECTED" ? "ghost" : "primary"}
                              disabled={!!busyId}
                              onClick={() => handleStatus(app.id, s)}
                              style={s === "REJECTED" ? { color: "var(--text-tertiary)" } : { background: EMP, borderColor: EMP }}
                            >
                              {busyId === app.id && busyAction === s ? <Loader2 size={12} className="animate-spin" /> : null}
                              {STATUS_META[s]?.label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {expandedId === app.id && (
                      <tr style={{ background: "var(--bg-white)" }}>
                        <td colSpan={4} className="px-4 pb-4">
                          <CandidateProfilePanel
                            loading={loadingProfileId === app.id && !profileCache[app.id]}
                            profile={profileCache[app.id]?.user?.profile}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); load(p); }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CandidateProfilePanel({ loading, profile }) {
  if (loading) {
    return (
      <div className="grid place-items-center rounded-xl p-6" style={{ background: "var(--bg-elev)" }}>
        <Spinner label="Loading profile" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="rounded-xl p-4 text-sm" style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}>
        No profile details available.
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-xl p-4 text-sm" style={{ background: "var(--bg-elev)" }}>
      {profile.summary && (
        <div>
          <p className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Summary</p>
          <p className="mt-1" style={{ color: "var(--text-primary)" }}>{profile.summary}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        <Field label="Industry" value={profile.industry || "Not provided"} />
        <Field label="Current salary" value={profile.currentSalary || "Not provided"} />
        <Field label="Desired job" value={profile.desiredJobTitle || "Not provided"} />
        <Field label="Desired location" value={profile.desiredLocation || "Not provided"} />
        <Field label="Availability" value={profile.availabilityToJoin || "Not provided"} />
        <Field label="Languages" value={profile.languagesKnown || "Not provided"} />
      </div>
      {profile.employmentEntries?.length > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Employment history</p>
          <ul className="mt-1 space-y-1">
            {profile.employmentEntries.map((e) => (
              <li key={e.id} style={{ color: "var(--text-primary)" }}>
                <strong>{e.jobTitle}</strong> — {e.companyName} ({e.startYear}{e.isCurrent ? " – Present" : e.endYear ? ` – ${e.endYear}` : ""})
              </li>
            ))}
          </ul>
        </div>
      )}
      {profile.educationEntries?.length > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Education</p>
          <ul className="mt-1 space-y-1">
            {profile.educationEntries.map((e) => (
              <li key={e.id} style={{ color: "var(--text-primary)" }}>{e.degree} — {e.institution}{e.endYear ? ` (${e.endYear})` : ""}</li>
            ))}
          </ul>
        </div>
      )}
      {profile.certifications?.length > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Certifications</p>
          <ul className="mt-1 space-y-1">
            {profile.certifications.map((c) => (
              <li key={c.id} style={{ color: "var(--text-primary)" }}>{c.name}{c.issuingOrg ? ` — ${c.issuingOrg}` : ""}{c.issueYear ? ` (${c.issueYear})` : ""}</li>
            ))}
          </ul>
        </div>
      )}
      {(profile.linkedInUrl || profile.githubUrl || profile.portfolioUrl) && (
        <div className="flex flex-wrap gap-3 text-xs">
          {profile.linkedInUrl && <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: EMP }}>LinkedIn →</a>}
          {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: EMP }}>GitHub →</a>}
          {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: EMP }}>Portfolio →</a>}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}
