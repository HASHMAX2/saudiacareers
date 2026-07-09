import { useEffect, useState } from "react";
import { Layers, Loader2, Plus } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

const STATUS_TONES = { LIVE: "green", BROKEN: "red", HIDDEN: "neutral" };

const emptyForm = { title: "", companyName: "", location: "", source: "", applyUrl: "" };

export function ScrapedJobs() {
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    const { data: res } = await adminApi.scrapedJobs({ page: 1, limit: 50 });
    setData(res.data);
  }

  useEffect(() => { load(); }, []);

  async function handleRecrawl(job) {
    setBusyId(job.id);
    setError("");
    try {
      await adminApi.recrawlScrapedJob(job.id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to recrawl");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkReviewed(job) {
    setBusyId(job.id);
    setError("");
    try {
      await adminApi.markScrapedJobReviewed(job.id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to mark reviewed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await adminApi.createScrapedJob(form);
      setShowAddModal(false);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setFormError(requestError.response?.data?.message ?? "Unable to add scraped job");
    } finally {
      setSaving(false);
    }
  }

  const scrapedJobs = data?.scrapedJobs ?? null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="page-title text-3xl md:text-4xl">Scraped jobs</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
            Jobs collected from company career pages. Candidates are redirected to the original apply link — never emailed on their behalf.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus size={16} />Add scraped job</Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {data && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <article className="card-soft p-5">
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Live listings</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{data.kpis.live}</p>
          </article>
          <article className="card-soft p-5">
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Broken apply links</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: "var(--red)" }}>{data.kpis.broken}</p>
          </article>
          <article className="card-soft p-5">
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Duplicate suspects</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{data.kpis.duplicateSuspects}</p>
          </article>
        </div>
      )}

      {!scrapedJobs ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading scraped jobs" /></div>
      ) : !scrapedJobs.length ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <Layers className="mx-auto" size={28} style={{ color: "var(--text-tertiary)" }} />
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No scraped jobs yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
          <table className="w-full text-sm">
            <thead style={{ background: "var(--bg-elev)" }}>
              <tr>
                {["Job", "Company", "Source", "Status", "Last checked", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scrapedJobs.map((job, i) => (
                <tr key={job.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none", background: "var(--bg-white)" }}>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.location}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{job.companyName}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{job.source}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={STATUS_TONES[job.status]}>{job.status}</Badge>
                      {job.isDuplicateSuspect && <Badge tone="amber">Duplicate?</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(job.lastCheckedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <a href={job.applyUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary">Open link</Button></a>
                      {job.isDuplicateSuspect && (
                        <Button size="sm" variant="secondary" disabled={busyId === job.id} onClick={() => handleMarkReviewed(job)}>
                          {busyId === job.id ? <Loader2 size={13} className="animate-spin" /> : null}Review
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" disabled={busyId === job.id} onClick={() => handleRecrawl(job)}>
                        {busyId === job.id ? <Loader2 size={13} className="animate-spin" /> : null}Recrawl
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showAddModal} title="Add scraped job" onClose={() => setShowAddModal(false)}>
        <form onSubmit={handleAdd} className="space-y-3">
          <Input id="sj-title" label="Job title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input id="sj-company" label="Company" required value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
          <Input id="sj-location" label="Location (optional)" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <Input id="sj-source" label="Source" required placeholder="e.g. Career page, Greenhouse" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
          <Input id="sj-url" label="Apply URL" type="url" required value={form.applyUrl} onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value }))} />
          {formError && <Alert>{formError}</Alert>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add job"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
