import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { useAuthStore } from "../../store/authStore.js";
import { Button } from "../common/Button.jsx";

const navClass = ({ isActive }) =>
  `btn-ghost text-sm ${isActive ? "font-semibold" : "font-medium"}`;

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
    <header className="glass-nav sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          className="flex items-center gap-2.5"
          onClick={() => setIsOpen(false)}
          to="/"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white shadow-sm" style={{ background: "var(--accent)" }}>
            S
          </span>
          <span className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)", fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            SaudiaCareers<span className="font-mono text-xs font-normal ml-0.5" style={{ color: "var(--text-tertiary)" }}>/careers</span>
          </span>
        </Link>
        <button
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          className="rounded-full p-2 md:hidden"
          style={{ color: "var(--text-primary)" }}
          onClick={() => setIsOpen((value) => !value)}
          type="button"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav
          className={`${
            isOpen ? "flex" : "hidden"
          } absolute inset-x-4 top-[4.25rem] flex-col gap-1 rounded-2xl bg-white p-3 shadow-xl md:static md:flex md:flex-row md:items-center md:gap-1 md:bg-transparent md:p-0 md:shadow-none`}
          style={{ border: isOpen ? "1px solid var(--border-default)" : "none" }}
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
              <Button className="w-full md:w-auto" variant="ghost" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <NavLink className={navClass} onClick={() => setIsOpen(false)} to="/login">
                Sign in
              </NavLink>
              <NavLink
                className="btn-primary text-center w-full md:w-auto"
                onClick={() => setIsOpen(false)}
                to="/register"
              >
                Join free
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
