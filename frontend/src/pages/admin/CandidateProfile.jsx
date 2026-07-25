import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, Loader2, Mail, MapPin, Phone, Sparkles, UserRound } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl p-4" style={{ background: "var(--bg-elev)" }}>
      <Icon className="mt-0.5 shrink-0" size={16} style={{ color: "var(--text-tertiary)" }} />
      <div>
        <span className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{label}</span>
        <span className="mt-1 block break-all font-medium text-sm" style={{ color: "var(--text-primary)" }}>{value || "Not provided"}</span>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{label}</dt>
      <dd className="mt-1" style={{ color: "var(--text-secondary)" }}>{value || "Not provided"}</dd>
    </div>
  );
}

export function CandidateProfile() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => adminApi.candidate(id).then(({ data }) => setCandidate(data.data)), [id]);
  useEffect(() => { setCandidate(null); setComments(""); setError(""); load(); }, [load]);

  async function handleSendFeedback() {
    if (!comments.trim()) return;
    setBusy(true);
    setError("");
    try {
      await adminApi.sendCandidateFeedback(id, comments.trim());
      setComments("");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to send feedback");
    } finally {
      setBusy(false);
    }
  }

  async function handleCalculateScore() {
    setScoring(true);
    setError("");
    try {
      await adminApi.calculateCandidateAIScore(id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to calculate score");
    } finally {
      setScoring(false);
    }
  }

  if (!candidate) return <div className="grid min-h-64 place-items-center"><Spinner label="Loading candidate" /></div>;

  const profile = candidate.profile;
  const review = candidate.candidateReview;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="page-title text-3xl md:text-4xl">{profile?.displayName || candidate.name}</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>Candidate since {formatDate(candidate.createdAt)}</p>
        </div>
        <Link to="/admin/candidates"><Button variant="secondary">Back to candidates</Button></Link>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <section className="card-soft p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold" style={{ color: "var(--text-primary)" }}>
              <UserRound size={17} style={{ color: "var(--accent)" }} />Contact information
            </h2>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <Info icon={Mail} label="Email" value={candidate.email} />
              <Info icon={Phone} label="Mobile" value={candidate.mobile} />
              <Info icon={MapPin} label="Location" value={profile?.location} />
              <Info icon={UserRound} label="Nationality" value={profile?.nationality} />
            </div>
          </section>

          <section className="card-soft p-5 sm:p-6">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Professional profile</h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <Field label="Designation" value={profile?.designation} />
              <Field label="Experience" value={profile?.experience} />
              <Field label="Industry" value={profile?.industry} />
              <Field label="Desired job title" value={profile?.desiredJobTitle} />
              <Field label="Skills" value={profile?.skills} />
              <Field label="Education" value={profile?.education} />
            </dl>
            {profile?.summary && (
              <div className="mt-4">
                <Field label="Professional summary" value={profile.summary} />
              </div>
            )}
          </section>

          {profile?.employmentEntries?.length > 0 && (
            <section className="card-soft p-5 sm:p-6">
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Employment history</h2>
              <div className="mt-4 space-y-3">
                {profile.employmentEntries.map((e) => (
                  <div key={e.id} className="rounded-xl p-4" style={{ background: "var(--bg-elev)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{e.jobTitle} · {e.companyName}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {e.startYear}{e.isCurrent ? " – Present" : e.endYear ? ` – ${e.endYear}` : ""}
                    </p>
                    {e.description && <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{e.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile?.educationEntries?.length > 0 && (
            <section className="card-soft p-5 sm:p-6">
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Education</h2>
              <div className="mt-4 space-y-3">
                {profile.educationEntries.map((e) => (
                  <div key={e.id} className="rounded-xl p-4" style={{ background: "var(--bg-elev)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{e.degree} · {e.institution}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {e.startYear ?? ""}{e.isCurrent ? " – Present" : e.endYear ? ` – ${e.endYear}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile?.certifications?.length > 0 && (
            <section className="card-soft p-5 sm:p-6">
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Certifications</h2>
              <div className="mt-4 space-y-3">
                {profile.certifications.map((c) => (
                  <div key={c.id} className="rounded-xl p-4" style={{ background: "var(--bg-elev)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>{c.issuingOrg}{c.issueYear ? ` · ${c.issueYear}` : ""}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="card-soft p-5">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Resume</h2>
            {candidate.resumeUrl
              ? <Button className="mt-4 w-full" onClick={() => window.open(candidate.resumeUrl, "_blank")}><Download size={15} />Download resume</Button>
              : <p className="mt-3 text-sm" style={{ color: "var(--text-tertiary)" }}>No resume is available.</p>}
          </section>

          <section className="card-soft p-5">
            <h2 className="flex items-center gap-2 font-semibold" style={{ color: "var(--text-primary)" }}>
              <Sparkles size={16} style={{ color: "var(--accent)" }} />AI score
            </h2>
            <div className="mt-3">
              {review?.aiScore != null ? <Badge tone="blue">{review.aiScore}</Badge> : <Badge tone="neutral">Not yet calculated</Badge>}
            </div>
            {review?.aiScoreNotes && <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>{review.aiScoreNotes}</p>}
            <Button className="mt-4 w-full" variant="secondary" disabled={scoring} onClick={handleCalculateScore}>
              {scoring ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Calculate AI score
            </Button>
          </section>

          <section className="card-soft p-5">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Send feedback</h2>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Emailed to the candidate along with a link back to their profile editor.
            </p>
            <textarea
              className="field-box mt-3 min-h-28 resize-y"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Example: Your resume link is broken — please re-upload a PDF."
            />
            <Button className="mt-3 w-full" disabled={busy || !comments.trim()} onClick={handleSendFeedback}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}Send feedback
            </Button>
            {review?.sentAt && (
              <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Last sent {formatDate(review.sentAt)}{review.adminComments ? `: "${review.adminComments}"` : ""}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
