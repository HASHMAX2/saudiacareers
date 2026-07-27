import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/formatDate.js";

export function Candidates() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load(p = page, q = search) {
    try {
      const { data: res } = await adminApi.candidates({ page: p, limit: 20, ...(q ? { search: q } : {}) });
      setData(res.data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to load candidates");
    }
  }

  useEffect(() => { load(1, search); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    load(1, search);
  }

  const candidates = data?.candidates ?? null;

  return (
    <div>
      <p className="section-label">Admin</p>
      <h1 className="page-title text-3xl md:text-4xl">Candidates</h1>
      <p className="mt-2 mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        All registered candidates with profile, AI score, and feedback status.
      </p>

      <form onSubmit={handleFilterSubmit} className="mb-5 flex flex-wrap items-center gap-2">
        <input
          className="h-11 min-w-40 flex-1 rounded-full px-4 text-sm outline-none"
          style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
          placeholder="Search name, email, or designation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors hover:bg-[var(--bg-elev)]"
          style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)", color: "var(--text-primary)" }}
        >
          Search
        </button>
      </form>

      {error && candidates && <Alert>{error}</Alert>}

      {!candidates ? (
        error ? (
          <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error}</p>
            <Button className="mt-4" variant="secondary" onClick={() => load(page, search)}>Retry</Button>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center"><Spinner label="Loading candidates" /></div>
        )
      ) : !candidates.length ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}>
          <Users className="mx-auto" size={28} style={{ color: "var(--text-tertiary)" }} />
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No candidates found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--bg-elev)" }}>
                <tr>
                  {["Candidate", "Location", "Designation", "AI Score", "Last Feedback Sent", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => {
                  const review = c.candidateReview;
                  const updatedSinceFeedback = review?.sentAt && review?.profileUpdatedAtSnapshot
                    && new Date(c.profile?.updatedAt ?? 0) > new Date(review.profileUpdatedAtSnapshot);
                  return (
                    <tr key={c.id} style={{ borderTop: i ? "1px solid var(--border-default)" : "none", background: "var(--bg-white)" }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{[c.profile?.city, c.profile?.country].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{c.profile?.designation || "—"}</td>
                      <td className="px-4 py-3">
                        {review?.aiScore != null
                          ? <Badge tone="blue">{review.aiScore}</Badge>
                          : <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Not calculated</span>}
                      </td>
                      <td className="px-4 py-3">
                        {review?.sentAt ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(review.sentAt)}</span>
                            {updatedSinceFeedback && <Badge tone="amber">Updated since</Badge>}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Link to={`/admin/candidates/${c.id}`}><Button size="sm" variant="secondary">View profile</Button></Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={(p) => { setPage(p); load(p); }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
