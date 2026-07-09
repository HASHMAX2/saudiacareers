import {
  Bookmark, ChevronDown, FileText, LayoutDashboard, Loader2, LogOut,
  Menu, Search, Settings, Sparkles, UserRound, X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { useAuthStore } from "../../store/authStore.js";
import { useAppliedJobsStore } from "../../store/appliedJobsStore.js";
import { useSavedJobsStore } from "../../store/savedJobsStore.js";
import { Button } from "../common/Button.jsx";
import { Toast } from "../common/Toast.jsx";

const LOGOUT_DELAY = 1500;

const CANDIDATE_MENU = [
  { label: "Overview",         to: "/dashboard",                  icon: LayoutDashboard },
  { label: "My Profile",       to: "/dashboard/profile",          icon: UserRound       },
  { label: "Browse Jobs",      to: "/jobs",                       icon: Search          },
  { label: "My Applications",  to: "/dashboard/applications",     icon: FileText        },
  { label: "Saved Jobs",       to: "/dashboard/saved-jobs",       icon: Bookmark        },
  { label: "Settings",         to: "/dashboard/change-password",  icon: Settings        },
];

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
  const resetSaved    = useSavedJobsStore((state) => state.reset);
  const resetApplied  = useAppliedJobsStore((state) => state.reset);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [empOpen, setEmpOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const timerRef = useRef(null);
  const userMenuRef = useRef(null);
  const empMenuRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);
  const closeEmpMenu = useCallback(() => setEmpOpen(false), []);

  useEffect(() => {
    if (!userMenuOpen) return;
    function onClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) closeUserMenu();
    }
    function onEscape(e) {
      if (e.key === "Escape") closeUserMenu();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [userMenuOpen, closeUserMenu]);

  useEffect(() => {
    if (!empOpen) return;
    function onClickOutside(e) {
      if (empMenuRef.current && !empMenuRef.current.contains(e.target)) closeEmpMenu();
    }
    function onEscape(e) {
      if (e.key === "Escape") closeEmpMenu();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [empOpen, closeEmpMenu]);

  async function handleLogout() {
    setLoggingOut(true);
    setUserMenuOpen(false);
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
      resetApplied();
      clearSession();
      setLoggingOut(false);
      setIsOpen(false);
    }, LOGOUT_DELAY);
  }

  const isCandidate = user && user.role === "CANDIDATE";

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
                {/* Non-candidate users: simple dashboard link */}
                {!isCandidate && (
                  <NavLink
                    className={navLinkClass}
                    style={navLinkStyle}
                    onClick={() => setIsOpen(false)}
                    to={user.role === "ADMIN" ? "/admin/dashboard" : "/employer/dashboard"}
                  >
                    Dashboard
                  </NavLink>
                )}

                {/* Candidate: name with dropdown (desktop) */}
                {isCandidate && (
                  <div className="relative hidden md:block" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-[15px] font-semibold transition-colors"
                      style={{
                        color: "var(--text-primary)",
                        background: userMenuOpen ? "var(--accent-subtle)" : "transparent",
                      }}
                      type="button"
                    >
                      <span
                        className="grid h-[30px] w-[30px] place-items-center rounded-full text-[12px] font-bold text-white shrink-0"
                        style={{ background: "var(--accent)" }}
                      >
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </span>
                      {user.name}
                      <ChevronDown
                        size={14}
                        style={{ transition: "transform 200ms", transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>

                    <div
                      className="absolute right-0 top-full w-56 rounded-2xl bg-white py-2"
                      style={{
                        border: "1px solid var(--border-default)",
                        boxShadow: "var(--sh-3)",
                        marginTop: "8px",
                        opacity: userMenuOpen ? 1 : 0,
                        transform: userMenuOpen ? "translateY(0)" : "translateY(-8px)",
                        pointerEvents: userMenuOpen ? "auto" : "none",
                        transition: "opacity 180ms ease, transform 180ms ease",
                      }}
                    >
                      {CANDIDATE_MENU.map(({ label, to, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={closeUserMenu}
                          className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-[var(--bg-elev)]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <Icon size={16} style={{ color: "var(--text-secondary)" }} />
                          {label}
                        </Link>
                      ))}
                      <div className="my-1.5 mx-3" style={{ borderTop: "1px solid var(--border-default)" }} />
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-red-50 disabled:opacity-50"
                        style={{ color: "var(--accent)" }}
                      >
                        {loggingOut ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <LogOut size={16} />
                        )}
                        {loggingOut ? "Signing out…" : "Logout"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Candidate: mobile menu items (inside hamburger) */}
                {isCandidate && (
                  <div className="md:hidden w-full">
                    <p
                      className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {user.name}
                    </p>
                    {CANDIDATE_MENU.map(({ label, to, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-2 py-2 text-[15px] font-medium transition-colors hover:opacity-70"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <Icon size={15} style={{ color: "var(--text-secondary)" }} />
                        {label}
                      </Link>
                    ))}
                    <div className="my-1.5 mx-1" style={{ borderTop: "1px solid var(--border-default)" }} />
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center gap-2.5 w-full px-2 py-2 text-[15px] font-medium transition-colors hover:opacity-70 disabled:opacity-50"
                      style={{ color: "var(--accent)" }}
                    >
                      {loggingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                      {loggingOut ? "Signing out…" : "Logout"}
                    </button>
                  </div>
                )}

                {/* Non-candidate: simple logout button */}
                {!isCandidate && (
                  <Button className="w-full md:w-auto" variant="ghost" disabled={loggingOut} onClick={handleLogout}>
                    {loggingOut
                      ? <><Loader2 size={14} className="animate-spin" />Signing out…</>
                      : "Log out"}
                  </Button>
                )}
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
                  ref={empMenuRef}
                >
                  <button
                    className="flex items-center gap-1 px-2 text-[15px] font-medium transition-colors hover:opacity-70"
                    style={{ color: "var(--text-secondary)" }}
                    onClick={() => setEmpOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={empOpen}
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
