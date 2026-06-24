import { ArrowRight, Search, Shield, Sparkles, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const companies = [
  "Saudi Aramco", "STC", "SABIC", "Noon", "Jarir", "stc pay",
  "Almarai", "NCB", "Bupa Arabia", "Tamimi",
  "Saudi Aramco", "STC", "SABIC", "Noon", "Jarir", "stc pay",
  "Almarai", "NCB", "Bupa Arabia", "Tamimi",
];

const trust = [
  { icon: Shield,       label: "Verified employers" },
  { icon: Zap,          label: "1-click apply" },
  { icon: CheckCircle2, label: "Free for candidates" },
];

const features = [
  {
    icon: Search,
    title: "Browse Saudi jobs",
    text: "Discover relevant opportunities across Riyadh, Jeddah, Dammam, and beyond.",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
  },
  {
    icon: Sparkles,
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
  return (
    <div className="-mt-6 sm:-mt-10">

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-8 pt-20 sm:px-10 lg:px-16 lg:pb-12 lg:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-12">

            <div className="lg:col-span-7 fade-up">
              <span
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em]"
                style={{ borderColor: "var(--border-default)", background: "var(--bg-white)", color: "var(--text-secondary)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
                Curated · No Spam · Saudi-focused
              </span>

              <h1
                className="text-balance leading-[0.95]"
                style={{
                  fontSize: "clamp(44px, 7.5vw, 88px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  fontFamily: "'Cabinet Grotesk', 'Satoshi', ui-sans-serif, system-ui, sans-serif",
                }}
              >
                Find work that<br />
                <em style={{ fontStyle: "italic", color: "var(--accent)" }}>feels</em> like yours.
              </h1>

              <p
                className="mt-6 max-w-xl text-[18px] leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                A career platform that respects your time. Find trusted opportunities and manage
                all your applications in one secure place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/jobs" className="btn-primary">
                  Browse roles <ArrowRight size={16} />
                </Link>
                <Link to="/register" className="btn-secondary">
                  <Sparkles size={14} /> Build your profile
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-6">
                {trust.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 text-[14px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Icon size={15} style={{ color: "var(--text-tertiary)" }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden lg:col-span-5 lg:block">
              <div className="relative h-[480px]">
                <img
                  src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=80"
                  alt=""
                  className="absolute right-0 top-0 h-72 w-72 object-cover"
                  style={{ borderRadius: "20px" }}
                />
                <img
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80"
                  alt=""
                  className="absolute bottom-8 left-0 h-56 w-56 object-cover"
                  style={{ borderRadius: "16px" }}
                />
                <img
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80"
                  alt=""
                  className="absolute right-16 top-44 h-44 w-44 object-cover"
                  style={{ borderRadius: "16px", border: "4px solid white" }}
                />
                <div
                  className="absolute bottom-28 right-2 flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[13px] font-medium"
                  style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)", color: "var(--text-primary)" }}
                >
                  <Sparkles size={13} style={{ color: "var(--accent)" }} />
                  500+ open roles
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Logo marquee — full viewport width breakout */}
      <div
        className="mt-0 overflow-hidden"
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          borderTop: "1px solid var(--border-default)",
          borderBottom: "1px solid var(--border-default)",
          padding: "28px 0",
        }}
      >
        <p className="section-label text-center mb-5">Talent at these places trusts SaudiaCareers</p>
        <div className="flex overflow-hidden">
          <div className="marquee-track flex items-center gap-16">
            {companies.map((name, i) => (
              <span
                key={i}
                className="whitespace-nowrap font-bold"
                style={{ fontSize: "28px", color: "var(--logo-muted)" }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-10 lg:px-16">
        <p className="section-label">Why SaudiaCareers</p>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h2
            className="text-balance"
            style={{ fontSize: "clamp(28px, 4vw, 56px)", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)", lineHeight: 1.0 }}
          >
            Roles worth your attention
          </h2>
          <Link to="/jobs" className="text-[15px] font-medium hover:opacity-70 flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text, img }) => (
            <article className="card-soft card-lift" key={title}>
              <div className="h-48 overflow-hidden">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-7">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                >
                  <Icon size={18} />
                </span>
                <h3
                  className="mt-4"
                  style={{ fontSize: "22px", fontWeight: 600, lineHeight: 1.3, color: "var(--text-primary)" }}
                >
                  {title}
                </h3>
                <p className="mt-2 text-[15px] leading-6" style={{ color: "var(--text-secondary)" }}>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Dark CTA banner */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-10 lg:px-16">
        <div
          className="relative overflow-hidden p-12 sm:p-16"
          style={{ background: "#141414", borderRadius: "24px" }}
        >
          {/* warm glow */}
          <div
            className="pointer-events-none absolute"
            style={{
              top: "-40px",
              right: "-40px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(244,67,54,0.35) 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-xl">
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-4"
              style={{ color: "var(--accent)" }}
            >
              Ready to start?
            </p>
            <h2
              className="text-balance text-white"
              style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.01em" }}
            >
              Less scrolling.<br />More signing.
            </h2>
            <p
              className="mt-4 text-[18px] leading-7 max-w-md"
              style={{ color: "var(--text-on-dark-secondary)" }}
            >
              Build a profile in two minutes. Only see roles you'd actually take.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary">
                Get started — free <ArrowRight size={16} />
              </Link>
              <Link to="/jobs" className="btn-dark-outline">
                Browse roles →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
