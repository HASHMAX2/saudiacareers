import { ArrowRight, BriefcaseBusiness, CheckCircle2, MapPin, Search, UserRoundCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/common/Button.jsx";

const values = [
  {
    icon: Search,
    title: "Browse Saudi jobs",
    text: "Discover relevant opportunities across Riyadh, Jeddah, Dammam, and beyond.",
  },
  {
    icon: UserRoundCheck,
    title: "Apply with one profile",
    text: "Keep your professional details and resume ready for a faster application process.",
  },
  {
    icon: CheckCircle2,
    title: "Track applications",
    text: "See every application and its latest status from your candidate dashboard.",
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
      <section className="relative overflow-hidden rounded-b-3xl bg-brand-950 px-5 py-16 text-white sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="absolute inset-y-0 right-0 hidden w-2/5 opacity-20 lg:block">
          <div className="absolute right-20 top-20 h-64 w-64 rounded-full border border-white/30" />
          <div className="absolute right-4 top-36 h-80 w-80 rounded-full border border-white/20" />
        </div>
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-100">
            <MapPin size={14} /> Careers across Saudi Arabia
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Your next career move starts here.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            Find trusted opportunities, build one professional profile, and manage your applications in one secure place.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/jobs"> 
            <Button className="w-full border border-emerald-300/40 bg-emerald-900/30 text-white hover:bg-emerald-700/60 sm:w-auto">
      Browse jobs <ArrowRight size={16} />
    </Button></Link>
            {/* <Link to="/register"><Button
      className="w-full border border-emerald-300/40 bg-emerald-900/30 text-red hover:bg-emerald-700/60 sm:w-auto"
      variant="secondary"
    >
      Create profile
    </Button></Link> */}
          </div>
          <form className="mt-10 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl sm:flex-row" onSubmit={searchJobs}>
            <div className="flex min-w-0 flex-1 items-center gap-3 px-2">
              <Search className="shrink-0 text-slate-400" size={20} />
              <input className="min-h-11 w-full border-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0" name="search" placeholder="Search by title, company, or skill" />
            </div>
            <Button className="sm:px-7" type="submit">Search jobs</Button>
          </form>
        </div>
      </section>

      <section className="py-14 sm:py-18">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Built for candidates</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">A simpler way to manage your job search</h2>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <article className="surface-card p-6 sm:p-7" key={title}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={21} /></span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card flex flex-col items-start justify-between gap-6 bg-slate-900 p-7 text-white sm:p-10 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-brand-300"><BriefcaseBusiness size={19} /><span className="text-sm font-semibold">Ready to get started?</span></div>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Build your candidate profile today.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Keep your details and resume ready for your next opportunity.</p>
        </div>
        <Link className="w-full shrink-0 md:w-auto" to="/register"><Button className="w-full md:w-auto">Sign up free <ArrowRight size={16} /></Button></Link>
      </section>
    </div>
  );
}
