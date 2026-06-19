import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <Link className="text-xl font-bold tracking-tight text-brand-800" to="/">
            SaudiaCareers
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            Connecting professionals with trusted career opportunities across Saudi Arabia.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600 md:justify-end">
          <Link className="hover:text-brand-700" to="/jobs">Browse jobs</Link>
          <Link className="hover:text-brand-700" to="/register">Create profile</Link>
          <Link className="hover:text-brand-700" to="/login">Candidate login</Link>
          <Link className="hover:text-brand-700" to="/admin/login">Admin login</Link>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} SaudiaCareers. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
