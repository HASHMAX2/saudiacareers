import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Building2, Globe, Linkedin, MapPin, SearchX } from "lucide-react";
import { jobsApi } from "../../api/jobs.js";
import { Spinner } from "../../components/common/Spinner.jsx";

function initials(name) {
  return (name ?? "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function CompanyProfile() {
  const { jobId } = useParams();
  const [company, setCompany] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setCompany(null);
    setNotFound(false);
    jobsApi.getCompany(jobId)
      .then(({ data }) => setCompany(data.data))
      .catch(() => setNotFound(true));
  }, [jobId]);

  if (notFound) {
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl p-8 text-center" style={{ border: "1.5px dashed var(--border-strong)" }}>
        <div>
          <SearchX className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
          <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>Company profile not available</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            There&apos;s no public profile on file for this company yet.
          </p>
        </div>
      </div>
    );
  }

  if (!company) return <div className="grid min-h-72 place-items-center"><Spinner label="Loading company profile" /></div>;

  return (
    <div className="max-w-2xl">
      <div className="card-soft p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-xl font-extrabold"
            style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
          >
            {company.companyName ? initials(company.companyName) : <Building2 size={26} />}
          </span>
          <div className="min-w-0">
            <h1 className="page-title text-2xl md:text-3xl">{company.companyName}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {company.industry && <span className="chip">{company.industry}</span>}
              {company.location && (
                <span className="chip flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: "var(--accent)" }} />{company.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {company.description && (
          <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border-default)" }}>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>About</h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
              {company.description}
            </p>
          </div>
        )}

        {(company.website || company.linkedinUrl) && (
          <div className="mt-6 flex flex-wrap gap-4 pt-6" style={{ borderTop: "1px solid var(--border-default)" }}>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-semibold hover:underline"
                style={{ color: "var(--accent)" }}
              >
                <Globe size={15} />Website
              </a>
            )}
            {company.linkedinUrl && (
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-semibold hover:underline"
                style={{ color: "var(--accent)" }}
              >
                <Linkedin size={15} />LinkedIn
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
