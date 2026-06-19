import { useEffect, useState } from "react";
import { BriefcaseBusiness, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { jobsApi } from "../../api/jobs.js";
import { Input } from "../../components/common/Input.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { JobCard } from "../../components/jobs/JobCard.jsx";
import { useDebounce } from "../../hooks/useDebounce.js";

const selectClass = "form-control appearance-none";

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-700">Opportunities across Saudi Arabia</p>
          <h1 className="page-heading mt-1">Find your next job</h1>
          <p className="page-subheading">Search trusted openings and narrow results by location, industry, experience, or employment type.</p>
        </div>
        {!loading && <span className="text-sm font-semibold text-slate-500">{result.pagination.total ?? result.jobs.length} jobs found</span>}
      </div>

      <div className="surface-card mt-7 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><SlidersHorizontal size={17} />Search and filters</div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative md:col-span-2 lg:col-span-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input className="pl-10" id="search" placeholder="Job title, company, or skill" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <select aria-label="Location" className={selectClass} value={params.location ?? ""} onChange={updateParam("location")}>
            <option value="">All locations</option><option>Riyadh</option><option>Jeddah</option><option>Dammam</option><option>Other</option>
          </select>
          <Input id="industry" placeholder="Industry" value={params.industry ?? ""} onChange={updateParam("industry")} />
          <Input id="experience" placeholder="Experience level" value={params.experience ?? ""} onChange={updateParam("experience")} />
          <Input id="employmentType" placeholder="Employment type" value={params.employmentType ?? ""} onChange={updateParam("employmentType")} />
          <select aria-label="Sort jobs" className={selectClass} value={params.sort} onChange={updateParam("sort")}>
            <option value="newest">Newest first</option><option value="deadline">Deadline soonest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-64 place-items-center"><Spinner label="Loading jobs" /></div>
      ) : result.jobs.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">{result.jobs.map((job) => <JobCard key={job.id} job={job} />)}</div>
      ) : (
        <div className="surface-card mt-6 grid min-h-64 place-items-center p-8 text-center">
          <div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500"><BriefcaseBusiness size={23} /></span><h2 className="mt-4 text-lg font-bold">No jobs found</h2><p className="mt-2 text-sm text-slate-600">Try broadening your search or clearing some filters.</p></div>
        </div>
      )}
      {!loading && result.jobs.length > 0 && <div className="mt-8"><Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} onPageChange={(page) => setParams((current) => ({ ...current, page }))} /></div>}
    </section>
  );
}
