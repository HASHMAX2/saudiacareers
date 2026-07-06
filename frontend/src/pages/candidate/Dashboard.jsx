import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Bookmark, CheckSquare, Eye, Mail, Pen, Rocket, Search, Shield, Sparkles } from "lucide-react";
import { applicationsApi } from "../../api/applications.js";
import { candidateApi } from "../../api/candidate.js";
import { savedJobsApi } from "../../api/savedJobs.js";
import { Carousel } from "../../components/dashboard/Carousel.jsx";
import { EmptyState } from "../../components/dashboard/EmptyState.jsx";
import { FAQCard } from "../../components/dashboard/FAQCard.jsx";
import { JobRailCard } from "../../components/dashboard/JobRailCard.jsx";
import { LogoTile, tint } from "../../components/dashboard/LogoTile.jsx";
import { PollWidget } from "../../components/dashboard/PollWidget.jsx";
import { ProfileCard } from "../../components/dashboard/ProfileCard.jsx";
import { SectionShell } from "../../components/dashboard/SectionShell.jsx";
import { StatCard } from "../../components/dashboard/StatCard.jsx";
import { VisibilityChart } from "../../components/dashboard/VisibilityChart.jsx";
import { Spinner } from "../../components/common/Spinner.jsx";
import { Link } from "react-router-dom";

const SUGGESTED_CHIPS = ["React Developer", "Sales Consultant", "Civil Engineer", "Healthcare", "Finance"];

const TOP_EMPLOYERS = [
  "Al Noor Group", "Gulf Peak", "Meridian Health", "Falcon Tech",
  "Cedar Hospitality", "Blue Harbor", "Zenith Financial", "Oryx Digital",
  "Sahara Energy", "Pearl Retail", "Vantage Consulting", "Emerald Facilities",
  "Nakhla Realty", "Rowad Steel", "Marsa Logistics", "Aafaq Bank",
  "Qamar Media", "Suhail Aviation", "Delta Marine", "Rihan Foods",
  "Bunyan Build", "Waha Petro", "Nasma Telecom", "Yara Textiles",
];

const FEATURED_EMPLOYERS = [
  "Al Futtaim Private Co.", "American Hospital Dubai", "Emirates Global Aluminium",
  "Ginco Contracting", "Hill International ME", "NMC Healthcare",
];
const FEATURED_CONSULTANTS = [
  "Brunel India Pvt. Ltd.", "Dicetek Consultancy", "Reliant HR",
  "Soundlines HR", "Sundus Consultancy", "TASC Labour Services",
];

const COMPANIES_HIRING = [
  { name: "Al Futtaim Retail", tags: ["Retail", "Dubai"] },
  { name: "ZainTech", tags: ["IT", "Dubai"] },
  { name: "Ghobash Group", tags: ["Finance", "Dubai"] },
  { name: "Royal Solutions", tags: ["IT", "Abu Dhabi"] },
  { name: "Lean Technologies", tags: ["B2B", "Riyadh"] },
  { name: "Sahara Energy", tags: ["Energy", "Doha"] },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tips, setTips] = useState([]);
  const [activeTab, setActiveTab] = useState("applied");
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState(null);
  const [savedJobs, setSavedJobs] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      candidateApi.dashboard(),
      candidateApi.careerTips(),
      applicationsApi.mine(),
    ]).then(([dashRes, tipsRes, appsRes]) => {
      setData(dashRes.data.data);
      setTips(tipsRes.data.data);
      setApplications(appsRes.data.data ?? []);
    });
  }, []);

  async function switchTab(key) {
    setActiveTab(key);
    if (key === "applied" && applications === null) {
      setTabLoading(true);
      try {
        const res = await applicationsApi.mine();
        setApplications(res.data.data ?? []);
      } finally {
        setTabLoading(false);
      }
    }
    if (key === "saved" && savedJobs === null) {
      setTabLoading(true);
      try {
        const res = await savedJobsApi.getAll();
        setSavedJobs(res.data.data ?? []);
      } finally {
        setTabLoading(false);
      }
    }
  }

  function handleSearch(e) {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/jobs?q=${encodeURIComponent(q)}`);
  }

  if (!data) {
    return (
      <div className="grid min-h-64 place-items-center">
        <Spinner label="Loading dashboard" />
      </div>
    );
  }

  const { profile, stats } = data;

  return (
    <div>
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden -mt-6 sm:-mt-10"
        style={{
          background: "linear-gradient(135deg, #C62828 0%, var(--accent) 45%, #EF5350 100%)",
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          borderBottomLeftRadius: "50%",
        }}
      >
        {/* rings decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <svg className="absolute -right-36 top-1/2 -translate-y-1/2 w-[620px] h-[620px] opacity-90" viewBox="0 0 600 600">
            <circle cx="300" cy="300" r="290" fill="rgba(255,255,255,0.05)" />
            <circle cx="300" cy="300" r="230" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="170" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="110" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="52" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="absolute right-[6%] -top-[10%] w-[340px] h-[150%] opacity-60 pointer-events-none"
          style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.10),transparent 70%)", transform: "rotate(18deg)", filter: "blur(6px)" }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-32">
          <h1 className="text-white text-[30px] sm:text-[36px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Welcome back!
          </h1>
          <p className="mt-2 text-white/80 text-[16px] max-w-lg">
            Pick up where you left off — new roles are waiting.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mt-7 max-w-[720px] flex items-center gap-2.5 bg-white rounded-full px-5 py-2.5 sm:py-3"
            style={{ boxShadow: "var(--sh-3)" }}
          >
            <Search size={20} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <input
              className="flex-1 min-w-0 bg-transparent outline-none text-[15.5px]"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
              placeholder="Enter skills, designations or company names"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="shrink-0 rounded-full px-6 py-2.5 sm:py-3 text-white text-[14.5px] font-bold"
              style={{ fontFamily: "var(--font-display)", background: "var(--accent-hover)" }}
            >
              Search jobs
            </button>
          </form>

          {/* Chips */}
          <div className="mt-5 flex items-center gap-2.5 flex-wrap">
            <span className="text-white/70 text-[12.5px] font-medium">Suggested</span>
            {SUGGESTED_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => navigate(`/jobs?q=${encodeURIComponent(chip)}`)}
                className="inline-flex items-center gap-2 text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)" }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN GRID ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 -mt-22 relative z-10" style={{ marginTop: "-88px" }}>
        <div className="dash-grid">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-7 min-w-0">
            {/* Jobs based on profile — tabs */}
            <SectionShell title="Jobs based on your profile" viewAllTo="/jobs">
              <div className="flex gap-1.5 p-1.5 rounded-xl mb-5" style={{ background: "var(--bg-elev)" }}>
                {[
                  { key: "applied", label: "Applied", count: applications?.length ?? stats.appliedCount },
                  { key: "saved",   label: "Saved",   count: savedJobs?.length ?? 0 },
                  { key: "alerts",  label: "Alerts",  count: 0 },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => switchTab(tab.key)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[9px] text-[14px] font-semibold transition-all"
                    style={{
                      fontFamily: "var(--font-display)",
                      background: activeTab === tab.key ? "#fff" : "transparent",
                      color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-secondary)",
                      boxShadow: activeTab === tab.key ? "var(--sh-1)" : "none",
                    }}
                  >
                    {tab.label}
                    <span
                      className="text-[11.5px] px-1.5 py-0 rounded-full"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: activeTab === tab.key ? "var(--accent-subtle)" : "#fff",
                        color: activeTab === tab.key ? "var(--accent)" : "var(--text-secondary)",
                        border: activeTab === tab.key ? "none" : "1px solid var(--border-default)",
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {tabLoading && (
                <div className="grid min-h-40 place-items-center">
                  <Spinner label="Loading" />
                </div>
              )}

              {!tabLoading && activeTab === "applied" && (
                applications && applications.length > 0 ? (
                  <Carousel>
                    {applications.map((app, i) => (
                      <JobRailCard key={app.id} job={app.job} index={i} />
                    ))}
                  </Carousel>
                ) : (
                  <EmptyState
                    icon={CheckSquare}
                    title="No applications yet"
                    description="When you apply to a job, it shows up here so you can track its status."
                    linkText="Browse jobs to apply"
                    linkTo="/jobs"
                  />
                )
              )}

              {!tabLoading && activeTab === "saved" && (
                savedJobs && savedJobs.length > 0 ? (
                  <Carousel>
                    {savedJobs.map((job, i) => (
                      <JobRailCard key={job.id} job={job} index={i} />
                    ))}
                  </Carousel>
                ) : (
                  <EmptyState
                    icon={Bookmark}
                    title="No saved jobs yet"
                    description="Bookmark roles you're interested in and find them here."
                    linkText="Browse open roles"
                    linkTo="/jobs"
                  />
                )
              )}

              {!tabLoading && activeTab === "alerts" && (
                <>
                  <EmptyState
                    icon={Bell}
                    title="No job alerts yet"
                    description="Create an alert and we'll send matching roles straight to your inbox."
                  />
                  <p className="text-center text-[13px] font-medium pb-4" style={{ color: "var(--text-tertiary)" }}>
                    Coming soon…
                  </p>
                </>
              )}
            </SectionShell>

            {/* Action cards */}
            <div className="grid gap-5 sm:grid-cols-3">
              <StatCard icon={Bell} sublabel="Looking for a specific job?" label="Create job alert" fgClass="accent" bgClass="accent-subtle" />
              <StatCard icon={Mail} label="Messages" sublabel="from employers" value={stats.messagesCount} bgClass="gold-bg" fgClass="gold-ink" />
              <StatCard icon={CheckSquare} label="Applied" sublabel="jobs so far" value={applications?.length ?? stats.appliedCount} bgClass="green-bg" fgClass="green" />
            </div>

            {/* Top employers */}
            <SectionShell title="Jobs by top employers">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                {TOP_EMPLOYERS.map((name, i) => {
                  const t = tint(i);
                  return (
                    <a
                      key={name}
                      href="#"
                      title={name}
                      className="grid place-items-center h-[80px] rounded-xl bg-white px-3 transition-all hover:shadow-md hover:-translate-y-0.5"
                      style={{ border: "1px solid var(--border-default)" }}
                    >
                      <span
                        className="text-[14px] font-extrabold text-center leading-tight"
                        style={{ fontFamily: "var(--font-display)", color: t.fg }}
                      >
                        {name}
                      </span>
                    </a>
                  );
                })}
              </div>
            </SectionShell>

            {/* Career tips */}
            {tips.length > 0 && (
              <SectionShell title="Career tips" viewAllTo="#">
                <Carousel>
                  {tips.map((post) => (
                    <article
                      key={post.id}
                      className="flex flex-col bg-white rounded-[14px] overflow-hidden transition-all hover:shadow-lg hover:-translate-y-[3px]"
                      style={{ flex: "0 0 300px", scrollSnapAlign: "start", border: "1px solid var(--border-default)" }}
                    >
                      <div
                        className="h-[130px] grid place-items-center px-5"
                        style={{ background: `linear-gradient(135deg, ${post.color}, rgba(0,0,0,0.18))` }}
                      >
                        <span className="text-white text-[15.5px] font-extrabold text-center opacity-95" style={{ fontFamily: "var(--font-display)" }}>
                          {post.title}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="text-[15px] font-bold leading-snug" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                          {post.title}
                        </div>
                        <div className="mt-2 text-[13px] leading-relaxed flex-1" style={{ color: "var(--text-secondary)" }}>
                          {post.excerpt}
                        </div>
                        <div className="mt-3.5 flex items-center justify-between text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                          <span className="flex items-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
                            <Eye size={13} /> {post.views.toLocaleString()}
                          </span>
                          <span className="text-[13px] font-semibold" style={{ color: "var(--accent)" }}>Read more →</span>
                          <span style={{ fontFamily: "var(--font-mono)" }}>{post.date}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </Carousel>
              </SectionShell>
            )}

            {/* Companies hiring */}
            <SectionShell title="Companies hiring for" subtitle={profile.designation || "your profile"} viewAllTo="/jobs">
              <Carousel>
                {COMPANIES_HIRING.map((co, i) => (
                  <article
                    key={co.name}
                    className="flex flex-col items-start bg-white rounded-[14px] p-5 transition-all hover:shadow-lg hover:-translate-y-[3px]"
                    style={{ flex: "0 0 270px", scrollSnapAlign: "start", border: "1px solid var(--border-default)" }}
                  >
                    <LogoTile name={co.name} size={52} radius={13} index={i + 1} />
                    <div className="mt-3.5 text-[15.5px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                      {co.name}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                      {co.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11.5px] font-medium px-2.5 py-0.5 rounded-full"
                          style={{ color: "var(--text-secondary)", background: "var(--bg-elev)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to="/jobs"
                      className="mt-auto w-full text-center py-2.5 rounded-[10px] text-[13.5px] font-bold transition-colors"
                      style={{
                        fontFamily: "var(--font-display)",
                        border: "1px solid var(--accent-subtle)",
                        background: "var(--accent-subtle)",
                        color: "var(--accent)",
                      }}
                    >
                      View jobs
                    </Link>
                  </article>
                ))}
              </Carousel>
            </SectionShell>

            {/* Featured employers / consultants */}
            <div className="grid gap-6 md:grid-cols-2">
              <SectionShell title="Featured employers" viewAllTo="#">
                {FEATURED_EMPLOYERS.map((name) => (
                  <a
                    key={name}
                    href="#"
                    className="flex items-center gap-2.5 py-3 px-1.5 text-[14px] font-medium transition-colors hover:underline"
                    style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--bg-elev)" }}
                  >
                    <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--accent-subtle)" }} />
                    {name}
                  </a>
                ))}
              </SectionShell>
              <SectionShell title="Featured consultants" viewAllTo="#">
                {FEATURED_CONSULTANTS.map((name) => (
                  <a
                    key={name}
                    href="#"
                    className="flex items-center gap-2.5 py-3 px-1.5 text-[14px] font-medium transition-colors hover:underline"
                    style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--bg-elev)" }}
                  >
                    <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--accent-subtle)" }} />
                    {name}
                  </a>
                ))}
              </SectionShell>
            </div>

            {/* Reminder banner */}
            <div
              className="flex items-center gap-4 px-6 py-5 rounded-[14px] flex-wrap"
              style={{ background: "linear-gradient(90deg, var(--green-bg), #fff)", border: "1px solid #CFEBDC" }}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-white"
                style={{ color: "var(--green)", boxShadow: "var(--sh-1)" }}
              >
                <Shield size={20} />
              </span>
              <span className="text-[14px] flex-1 min-w-0" style={{ color: "var(--text-primary)" }}>
                Make sure every detail is filled in correctly &mdash; it&apos;s what employers see first.
              </span>
              <Link
                to="/dashboard/profile"
                className="text-[14px] font-semibold whitespace-nowrap"
                style={{ color: "var(--accent)" }}
              >
                View & update profile
              </Link>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="flex flex-col gap-4 lg:gap-5">
            <ProfileCard profile={profile} />
            <VisibilityChart searchAppearances={stats.searchAppearances} employerActions={stats.employerActions} />
            <FAQCard />
            <PollWidget />
          </aside>
        </div>

        {/* BOOST SECTION — full width */}
        <section
          className="mt-7 rounded-2xl p-7 grid gap-7 items-center lg:grid-cols-[1fr_1.2fr]"
          style={{
            background: "linear-gradient(120deg, var(--accent-subtle), #FFF8F7 60%, var(--gold-bg))",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--sh-2)",
          }}
        >
          <div className="flex flex-col gap-2">
            <span
              className="grid h-14 w-14 place-items-center rounded-2xl bg-white mb-1.5"
              style={{ boxShadow: "var(--sh-2)" }}
            >
              <Rocket size={28} style={{ color: "var(--gold)" }} />
            </span>
            <h2 className="text-[23px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              Boost your job hunt
            </h2>
            <p className="text-[15px] max-w-sm" style={{ color: "var(--text-secondary)" }}>
              Get a CV that highlights your strengths and increase profile views by up to 50%.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Pen, title: "Resume writing", desc: "Get an expert to sharpen your CV so the right things stand out to employers.", bg: "var(--accent-subtle)", fg: "var(--accent)" },
              { icon: Sparkles, title: "Resume spotlight", desc: "Put your profile in front of recruiters searching the database first.", bg: "var(--gold-bg)", fg: "var(--gold-ink)" },
            ].map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-[14px] p-5 flex flex-col gap-2.5"
                style={{ border: "1px solid var(--border-default)", boxShadow: "var(--sh-1)" }}
              >
                <span className="grid h-[40px] w-[40px] place-items-center rounded-[10px]" style={{ background: s.bg, color: s.fg }}>
                  <s.icon size={20} />
                </span>
                <h4 className="text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{s.title}</h4>
                <p className="text-[13px] flex-1" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                <a href="#" className="text-[13.5px] font-semibold" style={{ color: "var(--accent)" }}>Know more →</a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
