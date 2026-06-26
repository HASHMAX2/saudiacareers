import { ChevronDown, Loader2, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { useAuthStore } from "../../store/authStore.js";
import { useSavedJobsStore } from "../../store/savedJobsStore.js";
import { Button } from "../common/Button.jsx";
import { Toast } from "../common/Toast.jsx";

const LOGOUT_DELAY = 1500;

const navLinkClass = ({ isActive }) =>
  `text-[15px] font-medium transition-colors px-5 py-2 rounded-full border ${
    isActive ? "border-current" : "border-transparent hover:bg-black/5"
  }`;

const navLinkStyle = ({ isActive }) => ({
  color: isActive ? "var(--accent)" : "var(--text-primary)",
});

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetSaved = useSavedJobsStore((state) => state.reset);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [empOpen, setEmpOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // clear session regardless of API error
    }
    setShowToast(true);
    timerRef.current = setTimeout(() => {
      setShowToast(false);
      navigate("/");
      resetSaved();
      clearSession();
      setLoggingOut(false);
      setIsOpen(false);
    }, LOGOUT_DELAY);
  }

  return (
    <>
      <Toast show={showToast} message="You've been signed out." tone="success" duration={LOGOUT_DELAY} />
      <header
        className="nav-header sticky top-0 z-40 flex items-center"
        style={{ background: "var(--bg-base)", height: "64px" }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            className="flex items-center gap-2.5 shrink-0"
            onClick={() => setIsOpen(false)}
            to="/"
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white shrink-0"
              style={{ background: "#141414" }}
            >
              S
            </span>
            <span className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>
              SaudiaCareers
              <span className="text-[14px] font-normal ml-1" style={{ color: "var(--text-tertiary)" }}>
                / careers
              </span>
            </span>
          </Link>

          <button
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
            className="rounded-full p-2 md:hidden"
            style={{ color: "var(--text-primary)" }}
            onClick={() => setIsOpen((v) => !v)}
            type="button"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav
            className={`${
              isOpen ? "flex" : "hidden"
            } absolute inset-x-4 top-[4.25rem] flex-col gap-1 rounded-2xl bg-white p-3 shadow-xl md:static md:flex md:flex-row md:items-center md:gap-10 md:bg-transparent md:p-0 md:shadow-none`}
            style={{ border: isOpen ? "1px solid var(--border-default)" : "none" }}
          >
            <NavLink
              className={navLinkClass}
              style={navLinkStyle}
              onClick={() => setIsOpen(false)}
              to="/jobs"
            >
              Browse
            </NavLink>

            {user ? (
              <>
                <NavLink
                  className={navLinkClass}
                  style={navLinkStyle}
                  onClick={() => setIsOpen(false)}
                  to={user.role === "ADMIN" ? "/admin/dashboard" : user.role === "EMPLOYER" ? "/employer/dashboard" : "/dashboard"}
                >
                  Dashboard
                </NavLink>
                <Button className="w-full md:w-auto" variant="ghost" disabled={loggingOut} onClick={handleLogout}>
                  {loggingOut
                    ? <><Loader2 size={14} className="animate-spin" />Signing out…</>
                    : "Log out"}
                </Button>
              </>
            ) : (
              <>
                <Link
                  className="text-[15px] font-medium transition-colors hover:opacity-70 px-2"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => setIsOpen(false)}
                  to="/login"
                >
                  Sign in
                </Link>

                {/* Desktop employer dropdown */}
                <div
                  className="relative hidden md:block"
                  onMouseEnter={() => setEmpOpen(true)}
                  onMouseLeave={() => setEmpOpen(false)}
                >
                  <button
                    className="flex items-center gap-1 px-2 text-[15px] font-medium transition-colors hover:opacity-70"
                    style={{ color: "var(--text-secondary)" }}
                    type="button"
                  >
                    Employers
                    <ChevronDown
                      size={14}
                      style={{ transition: "transform 200ms", transform: empOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>
                  <div
                    className="absolute right-0 top-full w-44 rounded-xl bg-white py-1.5 shadow-lg"
                    style={{
                      border: "1px solid var(--border-default)",
                      marginTop: "8px",
                      opacity: empOpen ? 1 : 0,
                      transform: empOpen ? "translateY(0)" : "translateY(-6px)",
                      pointerEvents: empOpen ? "auto" : "none",
                      transition: "opacity 150ms ease, transform 150ms ease",
                    }}
                  >
                    {[
                      { label: "Login",      to: "/employer/login"    },
                      { label: "Register",   to: "/employer/register" },
                      { label: "Contact Us", to: "/employer/contact"  },
                    ].map(({ label, to }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setEmpOpen(false)}
                        className="block px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-gray-50"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Mobile employer links (inside open nav) */}
                <div className="md:hidden w-full">
                  <p className="px-2 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                    Employers
                  </p>
                  {[
                    { label: "Login",      to: "/employer/login"    },
                    { label: "Register",   to: "/employer/register" },
                    { label: "Contact Us", to: "/employer/contact"  },
                  ].map(({ label, to }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setIsOpen(false)}
                      className="block px-2 py-1.5 text-[15px] font-medium transition-colors hover:opacity-70"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>

                <Link
                  className="btn-primary w-full md:w-auto justify-center"
                  style={{ paddingLeft: "20px", paddingRight: "20px", minHeight: "36px" }}
                  onClick={() => setIsOpen(false)}
                  to="/register"
                >
                  <Sparkles size={13} />
                  Join
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
