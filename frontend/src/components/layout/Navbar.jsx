import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { useAuthStore } from "../../store/authStore.js";
import { Button } from "../common/Button.jsx";

const navClass = ({ isActive }) =>
  `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
    isActive
      ? "bg-brand-50 text-brand-700"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      setIsOpen(false);
      navigate("/");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <Link
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-brand-800"
          onClick={() => setIsOpen(false)}
          to="/"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-xs font-bold text-white shadow-sm">
            SC
          </span>
          <span>SaudiaCareers</span>
        </Link>
        <button
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setIsOpen((value) => !value)}
          type="button"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav
          className={`${
            isOpen ? "flex" : "hidden"
          } absolute inset-x-4 top-[4.5rem] flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:static md:flex md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          <NavLink className={navClass} onClick={() => setIsOpen(false)} to="/jobs">
            Jobs
          </NavLink>
          {user ? (
            <>
              <NavLink
                className={navClass}
                onClick={() => setIsOpen(false)}
                to={user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"}
              >
                Dashboard
              </NavLink>
              <Button className="w-full md:w-auto" variant="secondary" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <NavLink className={navClass} onClick={() => setIsOpen(false)} to="/login">
                Log in
              </NavLink>
              <NavLink
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                onClick={() => setIsOpen(false)}
                to="/register"
              >
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
