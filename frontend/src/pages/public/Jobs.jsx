import { useEffect, useState } from "react";
import { BriefcaseBusiness, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { jobsApi } from "../../api/jobs.js";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { JobCard } from "../../components/jobs/JobCard.jsx";
import { useDebounce } from "../../hooks/useDebounce.js";

const selectCls = "field-box appearance-none";

export function Jobs() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [params, setParams] = useState({ page: 1, sort: "newest" });
  const [result, setResult] = useState({ jobs: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    jobsApi
      .list({ ...params, search: debouncedSearch || undefined })
      .then(({ data }) => setResult(data.data))
      .finally(() => setLoading(false));
  }, [params, debouncedSearch]);

  const updateParam = (key) => (event) =>
    setParams((current) => ({ ...current, page: 1, [key]: event.target.value || undefined }));

  return (
    <section>
      <div className="mb-8">
        <p className="section-label">Opportunities across Saudi Arabia</p>
        <h1 className="page-title">Open roles</h1>
        <p className="mt-3 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
          Search trusted openings and narrow results by location, industry, experience, or employment type.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 mb-5 shadow-sm" style={{ border: "1px solid var(--border-default)" }}>
        <Search size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
          id="search"
          placeholder="Job title, company, or skill..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select aria-label="Location" className={selectCls + " w-auto"} value={params.location ?? ""} onChange={updateParam("location")}>
          <option value="">All locations</option><option>Riyadh</option><option>Jeddah</option><option>Dammam</option><option>Other</option>
        </select>
        <input
          className="field-box w-auto"
          id="industry"
          placeholder="Industry"
          value={params.industry ?? ""}
          onChange={updateParam("industry")}
        />
        <input
          className="field-box w-auto"
          id="experience"
          placeholder="Experience"
          value={params.experience ?? ""}
          onChange={updateParam("experience")}
        />
        <input
          className="field-box w-auto"
          id="employmentType"
          placeholder="Employment type"
          value={params.employmentType ?? ""}
          onChange={updateParam("employmentType")}
        />
        <select aria-label="Sort jobs" className={selectCls + " w-auto"} value={params.sort} onChange={updateParam("sort")}>
          <option value="newest">Newest first</option><option value="deadline">Deadline soonest</option>
        </select>
        {!loading && (
          <span className="ml-auto font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
            {result.pagination.total ?? result.jobs.length} roles
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading jobs" /></div>
      ) : result.jobs.length ? (
        <div className="masonry">{result.jobs.map((job) => <JobCard key={job.id} job={job} />)}</div>
      ) : (
        <div className="card-soft mt-6 grid min-h-64 place-items-center p-8 text-center">
          <div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}>
              <BriefcaseBusiness size={23} />
            </span>
            <h2 className="mt-4 text-lg font-bold">No jobs found</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Try broadening your search or clearing some filters.</p>
          </div>
        </div>
      )}
      {!loading && result.jobs.length > 0 && (
        <div className="mt-8">
          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} onPageChange={(page) => setParams((current) => ({ ...current, page }))} />
        </div>
      )}
    </section>
  );
}
