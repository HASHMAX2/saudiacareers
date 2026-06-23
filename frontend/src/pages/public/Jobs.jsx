import { useEffect, useState } from "react";
import { BriefcaseBusiness, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { jobsApi } from "../../api/jobs.js";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { JobCard } from "../../components/jobs/JobCard.jsx";
import { useDebounce } from "../../hooks/useDebounce.js";

const locations      = ["Riyadh", "Jeddah", "Dammam", "Other"];
const employmentTypes = ["Full-time", "Part-time", "Contract", "Internship"];
const sortOptions    = [
  { value: "newest",   label: "Newest first" },
  { value: "deadline", label: "Deadline soonest" },
];

export function Jobs() {
  const [searchParams] = useSearchParams();
  const [search, setSearch]   = useState(searchParams.get("search") ?? "");
  const [params, setParams]   = useState({ page: 1, sort: "newest" });
  const [result, setResult]   = useState({ jobs: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const debouncedSearch       = useDebounce(search);

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
      {/* Header */}
      <div className="mb-8">
        <p className="section-label">Browse</p>
        <h1
          className="text-balance"
          style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.01em", color: "var(--text-primary)" }}
        >
          All open roles
        </h1>
        <p className="mt-3 max-w-xl text-[18px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Search trusted openings and narrow results by location, industry, experience, or type.
        </p>
      </div>

      {/* Search bar */}
      <div
        className="flex items-center gap-3 rounded-full bg-white px-5 mb-4"
        style={{ border: "1px solid var(--border-default)", height: "56px" }}
      >
        <Search size={20} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        <input
          className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[var(--text-tertiary)]"
          style={{ color: "var(--text-primary)" }}
          id="search"
          placeholder="Search role, company, or skill…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[10px] border bg-white transition-colors hover:bg-[var(--bg-elev)]"
          style={{ border: "1px solid var(--border-default)", padding: "10px 14px" }}
          aria-label="Filters"
        >
          <SlidersHorizontal size={16} style={{ color: "var(--text-secondary)" }} />
        </button>

        <select
          aria-label="Location"
          className="inline-flex items-center rounded-full border bg-white text-[14px] font-medium cursor-pointer appearance-none outline-none transition-colors hover:bg-[var(--bg-elev)]"
          style={{ border: "1px solid var(--border-pill)", padding: "10px 18px", color: "var(--text-primary)" }}
          value={params.location ?? ""}
          onChange={updateParam("location")}
        >
          <option value="">All locations</option>
          {locations.map((l) => <option key={l}>{l}</option>)}
        </select>

        <input
          className="inline-flex items-center rounded-full border bg-white text-[14px] font-medium outline-none transition-colors placeholder:text-[var(--text-tertiary)] hover:bg-[var(--bg-elev)]"
          style={{ border: "1px solid var(--border-pill)", padding: "10px 18px", color: "var(--text-primary)" }}
          placeholder="Industry"
          value={params.industry ?? ""}
          onChange={updateParam("industry")}
        />

        <input
          className="inline-flex items-center rounded-full border bg-white text-[14px] font-medium outline-none transition-colors placeholder:text-[var(--text-tertiary)] hover:bg-[var(--bg-elev)]"
          style={{ border: "1px solid var(--border-pill)", padding: "10px 18px", color: "var(--text-primary)" }}
          placeholder="Experience"
          value={params.experience ?? ""}
          onChange={updateParam("experience")}
        />

        <select
          aria-label="Employment type"
          className="inline-flex items-center rounded-full border bg-white text-[14px] font-medium cursor-pointer appearance-none outline-none transition-colors hover:bg-[var(--bg-elev)]"
          style={{ border: "1px solid var(--border-pill)", padding: "10px 18px", color: "var(--text-primary)" }}
          value={params.employmentType ?? ""}
          onChange={updateParam("employmentType")}
        >
          <option value="">All types</option>
          {employmentTypes.map((t) => <option key={t}>{t}</option>)}
        </select>

        <span style={{ color: "var(--border-default)", userSelect: "none" }}>·</span>

        <select
          aria-label="Sort jobs"
          className="inline-flex items-center rounded-full border bg-white text-[14px] font-medium cursor-pointer appearance-none outline-none transition-colors hover:bg-[var(--bg-elev)]"
          style={{ border: "1px solid var(--border-pill)", padding: "10px 18px", color: "var(--text-primary)" }}
          value={params.sort}
          onChange={updateParam("sort")}
        >
          {sortOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>

        {!loading && (
          <span className="ml-auto text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            {result.pagination.total ?? result.jobs.length} roles
          </span>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading jobs" /></div>
      ) : result.jobs.length ? (
        <div className="masonry">{result.jobs.map((job) => <JobCard key={job.id} job={job} />)}</div>
      ) : (
        <div className="card-soft mt-6 grid min-h-64 place-items-center p-8 text-center">
          <div>
            <span
              className="mx-auto grid h-12 w-12 place-items-center rounded-full"
              style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}
            >
              <BriefcaseBusiness size={23} />
            </span>
            <h2 className="mt-4 text-lg font-bold">No roles found</h2>
            <p className="mt-2 text-[15px]" style={{ color: "var(--text-secondary)" }}>
              Try broadening your search or clearing some filters.
            </p>
          </div>
        </div>
      )}

      {!loading && result.jobs.length > 0 && (
        <div className="mt-8">
          <Pagination
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            onPageChange={(page) => setParams((current) => ({ ...current, page }))}
          />
        </div>
      )}
    </section>
  );
}
