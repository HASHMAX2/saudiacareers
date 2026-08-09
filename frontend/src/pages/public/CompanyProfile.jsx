import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Globe,
  HeartPulse,
  Home,
  Linkedin,
  MapPin,
  Plane,
  SearchX,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { companiesApi } from "../../api/companies.js";
import { JobCard } from "../../components/jobs/JobCard.jsx";
import { LogoTile } from "../../components/dashboard/LogoTile.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";

const PERKS_CATALOG = {
  GOSI: { label: "GOSI coverage", icon: ShieldCheck },
  HOUSING: { label: "Housing allowance", icon: Home },
  FLIGHT_TICKETS: { label: "Annual flight tickets", icon: Plane },
  MEDICAL_INSURANCE: { label: "Medical insurance", icon: HeartPulse },
};

export function CompanyProfile() {
  const { type, id } = useParams();
  const [company, setCompany] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setCompany(null);
    setNotFound(false);
    setFollowing(false);
    companiesApi.get(type, id)
      .then(({ data }) => setCompany(data.data))
      .catch(() => setNotFound(true));
  }, [type, id]);

  if (notFound) {
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl p-8 text-center" style={{ border: "1.5px dashed var(--border-strong)" }}>
        <div>
          <SearchX className="mx-auto" size={30} style={{ color: "var(--text-tertiary)" }} />
          <h2 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>Company profile not available</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            There&apos;s no public profile on file for this company yet.
          </p>
          <Link to="/jobs" className="btn-primary mt-5 inline-flex" style={{ minHeight: "40px", padding: "0 20px", fontSize: "14px" }}>
            Browse open roles
          </Link>
        </div>
      </div>
    );
  }

  if (!company) return <div className="grid min-h-72 place-items-center"><Spinner label="Loading company profile" /></div>;

  const stats = [
    { label: "Industry", value: company.industry },
    { label: "Company size", value: company.companySize },
    { label: "Founded", value: company.foundedYear },
    { label: "Headquarters", value: company.location },
  ].filter((s) => s.value);

  const perks = (company.perks ?? []).filter((key) => PERKS_CATALOG[key]);

  return (
    <div className="space-y-6">
      {/* Cover banner — full-bleed breakout to the edge of the viewport, matching
          the pattern already used for the company marquee on the landing page. */}
      <div
        className="relative -mx-4 h-40 sm:-mx-6 sm:h-48 lg:-mx-8 lg:h-56"
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          background: company.coverImageUrl
            ? `linear-gradient(135deg, rgba(10,15,25,0.55) 0%, rgba(10,15,25,0.15) 100%), url(${company.coverImageUrl})`
            : "linear-gradient(135deg, var(--bg-dark) 0%, var(--accent) 140%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Header card — overlaps the banner with the logo pulled up */}
      <div className="card-soft -mt-16 p-6 sm:-mt-20 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="rounded-2xl bg-white p-1.5" style={{ border: "1px solid var(--border-default)", boxShadow: "var(--sh-2)" }}>
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.companyName} width={72} height={72} className="rounded-xl object-contain" />
              ) : (
                <LogoTile name={company.companyName} size={72} radius={12} />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="page-title text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                  {company.companyName}
                </h1>
                {company.verified && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: "var(--gold-bg)", color: "var(--gold-ink)" }}
                  >
                    <ShieldCheck size={12} />Verified
                  </span>
                )}
                {company.visionRelevant && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: "var(--amber-bg)", color: "var(--gold-ink)" }}
                  >
                    <Sparkles size={12} style={{ color: "var(--amber)" }} />Vision 2030
                  </span>
                )}
              </div>
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

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setFollowing((f) => !f)}
              className={following ? "btn-primary" : "btn-secondary"}
              style={{ minHeight: "40px", padding: "0 20px", fontSize: "14px" }}
            >
              {following ? "Following" : "Follow"}
            </button>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary inline-flex items-center gap-2"
                style={{ minHeight: "40px", padding: "0 20px", fontSize: "14px" }}
              >
                <Globe size={15} />Visit Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      {stats.length > 0 && (
        <div className="card-soft grid grid-cols-2 gap-6 p-6 sm:grid-cols-4 sm:p-8">
          {stats.map((s) => (
            <div key={s.label}>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{s.label}</span>
              <p className="mt-1 text-lg font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* About */}
      {company.description && (
        <section className="card-soft p-6 sm:p-8">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>About {company.companyName}</h2>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            {company.description}
          </p>
          {company.linkedinUrl && (
            <a
              href={company.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
              style={{ color: "var(--accent)" }}
            >
              <Linkedin size={15} />LinkedIn
            </a>
          )}
        </section>
      )}

      {/* Open positions */}
      <section className="card-soft p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Open positions</h2>
          {company.openJobsCount > 0 && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "var(--green-bg)", color: "var(--green)" }}
            >
              {company.openJobsCount} open
            </span>
          )}
        </div>
        {company.jobs.length > 0 ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {company.jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        ) : (
          <div className="mt-5 grid min-h-40 place-items-center rounded-xl p-6 text-center" style={{ border: "1.5px dashed var(--border-strong)" }}>
            <div>
              <Users className="mx-auto" size={24} style={{ color: "var(--text-tertiary)" }} />
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No open roles at {company.companyName} right now.</p>
            </div>
          </div>
        )}
      </section>

      {/* Perks / benefits */}
      {perks.length > 0 && (
        <section className="card-soft p-6 sm:p-8">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Employee benefits</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {perks.map((key) => {
              const perk = PERKS_CATALOG[key];
              const Icon = perk.icon;
              return (
                <div key={key} className="flex flex-col items-center gap-2 rounded-xl p-4 text-center" style={{ background: "var(--bg-elev)" }}>
                  <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--accent-subtle)" }}>
                    <Icon size={18} style={{ color: "var(--accent)" }} />
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{perk.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
