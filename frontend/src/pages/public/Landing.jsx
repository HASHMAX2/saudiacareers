import { ArrowRight, CheckCircle2, MapPin, Search, UserRoundCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const companies = [
  "Saudi Aramco", "STC", "SABIC", "Noon", "Jarir", "stc pay",
  "Almarai", "NCB", "Bupa Arabia", "Tamimi",
  "Saudi Aramco", "STC", "SABIC", "Noon", "Jarir", "stc pay",
  "Almarai", "NCB", "Bupa Arabia", "Tamimi",
];

const features = [
  {
    icon: Search,
    title: "Browse Saudi jobs",
    text: "Discover relevant opportunities across Riyadh, Jeddah, Dammam, and beyond.",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
  },
  {
    icon: UserRoundCheck,
    title: "Apply with one profile",
    text: "Keep your professional details and resume ready for a faster application process.",
    img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  },
  {
    icon: CheckCircle2,
    title: "Track applications",
    text: "See every application and its latest status from your candidate dashboard.",
    img: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&q=80",
  },
];

export function Landing() {
  const navigate = useNavigate();

  function searchJobs(event) {
    event.preventDefault();
    const search = new FormData(event.currentTarget).get("search");
    navigate(search ? `/jobs?search=${encodeURIComponent(search)}` : "/jobs");
  }

  return (
    <div className="-mt-6 sm:-mt-10">
      {/* Hero */}
      <section className="grain relative overflow-hidden px-5 pb-24 pt-20 sm:px-10 lg:px-16 lg:pb-32 lg:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7 fade-up">
              <span className="chip mb-6 inline-flex items-center gap-2">
                <MapPin size={13} style={{ color: "var(--accent)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Careers across Saudi Arabia</span>
              </span>
              <h1 className="page-title text-balance leading-[1.08]">
                Your next career move<br />starts here.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Find trusted opportunities, build one professional profile, and manage your applications in one secure place.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/jobs" className="btn-primary">
                  Browse jobs <ArrowRight size={16} />
                </Link>
                <Link to="/register" className="btn-secondary">
                  Create profile
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-5">
                {["Verified employers", "Secure applications", "Free for candidates"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                    <CheckCircle2 size={13} style={{ color: "var(--accent)" }} />{t}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden lg:col-span-5 lg:block">
              <div className="relative h-[480px]">
                <img
                  src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=80"
                  alt=""
                  className="absolute right-0 top-0 h-72 w-72 rounded-3xl object-cover shadow-2xl"
                />
                <img
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80"
                  alt=""
                  className="absolute bottom-8 left-0 h-56 w-56 rounded-2xl object-cover shadow-xl"
                />
                <img
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80"
                  alt=""
                  className="absolute right-16 top-44 h-44 w-44 rounded-2xl object-cover shadow-lg border-4 border-white"
                />
                <div className="chip absolute bottom-28 right-2 whitespace-nowrap px-4 py-2 shadow-lg">
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>500+ open roles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <div className="mx-auto max-w-2xl px-5 -mt-8 sm:px-10 lg:px-0 relative z-10">
        <form
          className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-lg"
          style={{ border: "1px solid var(--border-default)" }}
          onSubmit={searchJobs}
        >
          <Search size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            name="search"
            placeholder="Search by title, company, or skill..."
          />
          <button type="submit" className="btn-primary shrink-0 py-2 px-5 text-sm">Search</button>
        </form>
      </div>

      {/* Marquee */}
      <div className="mt-16 overflow-hidden py-4">
        <p className="section-label text-center mb-4">Trusted by leading Saudi companies</p>
        <div className="relative flex overflow-hidden">
          <div className="marquee-track flex items-center gap-10">
            {companies.map((name, i) => (
              <span key={i} className="whitespace-nowrap text-sm font-semibold" style={{ color: "var(--text-tertiary)" }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-10 lg:px-16">
        <p className="section-label">Why SaudiaCareers</p>
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)", fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          A simpler way to manage your job search
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text, img }) => (
            <article className="card-soft" key={title}>
              <div className="h-44 overflow-hidden">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Dark CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-10 lg:px-16">
        <div className="relative overflow-hidden rounded-3xl p-10 sm:p-14" style={{ background: "#1A1A19" }}>
          <div
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--accent)" }}
          />
          <div className="relative max-w-xl">
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Ready to start?</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Build your candidate profile today.
            </h2>
            <p className="mt-4 text-sm leading-7" style={{ color: "rgba(255,255,255,0.55)" }}>
              Keep your details and resume ready for your next opportunity.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary">
                Sign up free <ArrowRight size={16} />
              </Link>
              <Link
                to="/jobs"
                className="btn-secondary"
                style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)", color: "#fff" }}
              >
                Browse jobs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
