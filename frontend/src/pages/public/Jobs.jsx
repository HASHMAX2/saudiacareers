import { BriefcaseBusiness, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { jobsApi } from "../../api/jobs.js";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { JobCard } from "../../components/jobs/JobCard.jsx";
import { FilterPanel } from "../../components/jobs/FilterPanel.jsx";
import { EMPTY_FILTERS } from "../../utils/constants.js";

function filtersToParams(filters) {
  const params = { sort: filters.sort };
  if (filters.locations.length)       params.locations       = filters.locations.join("|");
  if (filters.industries.length)      params.industries      = filters.industries.join("|");
  if (filters.employmentTypes.length) params.employmentTypes = filters.employmentTypes.join("|");
  if (filters.experiences.length)     params.experiences     = filters.experiences.join("|");
  if (filters.salaries?.length)        params.salaries        = filters.salaries.join("|");
  if (filters.genders.length)         params.genders         = filters.genders.join("|");
  if (filters.nationalities.length)   params.nationalities   = filters.nationalities.join("|");
  if (filters.freshness.length) {
    const maxDays = Math.max(...filters.freshness);
    params.postedAfter = new Date(Date.now() - maxDays * 86400000).toISOString();
  }
  return params;
}

function countActive(filters) {
  return (
    filters.locations.length +
    filters.industries.length +
    filters.employmentTypes.length +
    filters.experiences.length +
    (filters.salaries?.length ?? 0) +
    filters.genders.length +
    filters.nationalities.length +
    filters.freshness.length
  );
}

export function Jobs() {
  const [applied, setApplied]             = useState(EMPTY_FILTERS);
  const [page, setPage]                   = useState(1);
  const [result, setResult]               = useState({ jobs: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading]             = useState(true);
  const [filterOptions, setFilterOptions] = useState(null);
  const [mobileOpen, setMobileOpen]       = useState(false);

  useEffect(() => {
    jobsApi.filterOptions().then(({ data }) => setFilterOptions(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    jobsApi
      .list({ page, ...filtersToParams(applied) })
      .then(({ data }) => setResult(data.data))
      .finally(() => setLoading(false));
  }, [page, applied]);

  function handleApply(newFilters) {
    setPage(1);
    setApplied(newFilters);
    setMobileOpen(false);
  }

  const active = countActive(applied);

  return (
    <section>
      {/* Page header */}
      <div className="mb-8">
        <p className="section-label">Browse</p>
        <h1
          className="text-balance"
          style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.01em", color: "var(--text-primary)" }}
        >
          All open roles
        </h1>
        <p className="mt-3 max-w-xl text-[18px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Filter by location, industry, experience, and more.
        </p>
      </div>

      {/* Mobile filter toggle */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            border: "1px solid var(--border-default)",
            background: active > 0 ? "var(--accent-subtle)" : "var(--bg-white)",
            color: active > 0 ? "var(--accent)" : "var(--text-primary)",
          }}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <SlidersHorizontal size={15} />
          {mobileOpen ? "Hide filters" : "Filters"}
          {active > 0 && (
            <span
              className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              {active}
            </span>
          )}
          {mobileOpen ? <X size={14} /> : null}
        </button>

        {mobileOpen && (
          <div className="mt-3">
            <FilterPanel
              filters={applied}
              onApply={handleApply}
              filterOptions={filterOptions}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        )}
      </div>

      {/* 2-column layout */}
      <div className="lg:grid lg:gap-8" style={{ gridTemplateColumns: "260px 1fr" }}>

        {/* Filter sidebar — desktop only */}
        <aside className="hidden lg:block">
          <div
            style={{ position: "sticky", top: "80px", maxHeight: "calc(100vh - 100px)", overflowY: "auto", paddingBottom: "12px" }}
          >
            <FilterPanel
              filters={applied}
              onApply={handleApply}
              filterOptions={filterOptions}
            />
          </div>
        </aside>

        {/* Job results */}
        <div>
          {!loading && (
            <p className="mb-4 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              {result.pagination.total} role{result.pagination.total !== 1 ? "s" : ""} found
              {active > 0 && " · filtered"}
            </p>
          )}

          {loading ? (
            <div className="grid min-h-64 place-items-center">
              <Spinner label="Loading jobs" />
            </div>
          ) : result.jobs.length ? (
            <div className="grid gap-4">
              {result.jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          ) : (
            <div className="card-soft grid min-h-64 place-items-center p-8 text-center">
              <div>
                <span
                  className="mx-auto grid h-12 w-12 place-items-center rounded-full"
                  style={{ background: "var(--bg-elev)", color: "var(--text-tertiary)" }}
                >
                  <BriefcaseBusiness size={23} />
                </span>
                <h2 className="mt-4 text-lg font-bold">No roles found</h2>
                <p className="mt-2 text-[15px]" style={{ color: "var(--text-secondary)" }}>
                  Try adjusting or clearing your filters.
                </p>
                {active > 0 && (
                  <button
                    type="button"
                    className="mt-4 text-sm font-semibold hover:underline"
                    style={{ color: "var(--accent)" }}
                    onClick={() => handleApply(EMPTY_FILTERS)}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}

          {!loading && result.jobs.length > 0 && result.pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                page={result.pagination.page}
                totalPages={result.pagination.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
