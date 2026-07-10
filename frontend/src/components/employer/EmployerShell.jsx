import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Briefcase, Building2, ChevronDown, Clock3, LayoutDashboard, Loader2, LogOut,
  Menu, PlusCircle, Users, Wallet, X,
} from "lucide-react";
import { authApi } from "../../api/auth.js";
import { employerApi } from "../../api/employer.js";
import { useAuthStore } from "../../store/authStore.js";
import { useNotificationStore } from "../../store/notificationStore.js";
import { NotificationBell } from "../common/NotificationBell.jsx";
import { Toast } from "../common/Toast.jsx";

const EMP = "var(--accent)";
const EMP_SUBTLE = "var(--accent-subtle)";
const LOGOUT_DELAY = 1500;

const VERIFICATION_META = {
  PENDING:  { label: "Verification pending", color: "#8A5D10", bg: "var(--gold-bg)" },
  APPROVED: { label: "Verified",              color: "var(--green)", bg: "var(--green-bg)" },
  REJECTED: { label: "Verification rejected", color: "#B91C1C", bg: "#FEF2F2" },
};

export function EmployerShell() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetNotifications = useNotificationStore((state) => state.reset);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [pendingCount, setPendingCount] = useState(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const menuRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    employerApi.getProfile().then(({ data }) => setProfile(data.data)).catch(() => setProfile({}));
    employerApi.getDashboard().then(({ data }) => setMetrics(data.data)).catch(() => {});
    employerApi.listPendingJobs().then(({ data }) => setPendingCount(data.data.length)).catch(() => {});
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu();
    }
    function onEscape(e) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen, closeMenu]);

  async function handleLogout() {
    setLoggingOut(true);
    setMenuOpen(false);
    try {
      await authApi.logout();
    } catch {
      // clear session regardless of API error
    }
    setShowToast(true);
    timerRef.current = setTimeout(() => {
      setShowToast(false);
      navigate("/employer/login");
      clearSession();
      resetNotifications();
      setLoggingOut(false);
    }, LOGOUT_DELAY);
  }

  const verMeta = VERIFICATION_META[profile?.verificationStatus] ?? VERIFICATION_META.PENDING;
  const initials = (user?.name ?? "E").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const navItems = [
    { label: "Overview", to: "/employer/dashboard", icon: LayoutDashboard, end: true },
    { label: "Jobs", to: "/employer/jobs", icon: Briefcase, badge: metrics?.totalJobs, end: true },
    { label: "Pending Jobs", to: "/employer/jobs/pending", icon: Clock3, badge: pendingCount },
    { label: "Post a Job", to: "/employer/jobs/create", icon: PlusCircle },
    { label: "Applicants", to: "/employer/applicants", icon: Users, badge: metrics?.totalApplications },
    { label: "Billing", to: "/employer/billing", icon: Wallet },
    { label: "Company Profile", to: "/employer/verification", icon: Building2 },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-elev)" }}>
      <Toast show={showToast} message="You've been signed out." tone="success" duration={LOGOUT_DELAY} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-40 flex h-screen w-[275px] shrink-0 flex-col gap-5 overflow-y-auto p-4 transition-transform duration-200 md:sticky md:top-0 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--bg-white)", borderRight: "1px solid var(--border-default)" }}
      >
        <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--border-default)" }}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white" style={{ background: EMP }}>S</span>
          <div>
            <p className="text-[15px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>SaudiaCareers</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Employer Portal</p>
          </div>
          <button className="ml-auto rounded-lg p-1.5 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} style={{ color: "var(--text-tertiary)" }} />
          </button>
        </div>

        <div className="rounded-2xl p-3" style={{ border: "1px solid var(--border-default)", background: "var(--bg-elev)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Workspace</p>
          <p className="mt-1 truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>{profile?.companyName || "Your company"}</p>
          <p className="mt-1 text-xs font-semibold" style={{ color: verMeta.color }}>{verMeta.label}</p>
        </div>

        <nav className="flex flex-col gap-1">
          <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Employer</p>
          {navItems.map(({ label, to, icon: Icon, end, badge }) => {
            const badgePill = typeof badge === "number" && (
              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: EMP_SUBTLE, color: EMP }}>
                {badge}
              </span>
            );

            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? "text-white" : "hover:bg-[var(--bg-elev)]"}`
                }
                style={({ isActive }) => ({ background: isActive ? EMP : "transparent", color: isActive ? "#fff" : "var(--text-secondary)" })}
              >
                <Icon size={17} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {badgePill}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl p-4" style={{ border: "1px solid rgba(244,67,54,0.25)", background: `linear-gradient(180deg, ${EMP_SUBTLE}, #fff)` }}>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Need more job credits?</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Upgrade your plan or buy extra credits to keep publishing.
          </p>
          <NavLink
            to="/employer/billing"
            onClick={() => setSidebarOpen(false)}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl py-2 text-sm font-bold text-white"
            style={{ background: EMP }}
          >
            View billing
          </NavLink>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        <header
          className="sticky top-0 z-20 flex items-center gap-4 px-4 py-3 sm:px-6"
          style={{ background: "var(--bg-white)", borderBottom: "1px solid var(--border-default)" }}
        >
          <button className="rounded-lg p-2 md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} style={{ color: "var(--text-primary)" }} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell accent={EMP} />
            <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[15px] font-semibold transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                background: menuOpen ? EMP_SUBTLE : "transparent",
                color: "var(--text-primary)",
              }}
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white" style={{ background: EMP }}>
                {initials}
              </span>
              <span className="hidden sm:inline">{user?.name}</span>
              <ChevronDown
                size={14}
                style={{ color: "var(--text-tertiary)", transition: "transform 200ms", transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            <div
              className="absolute right-0 top-full z-30 w-56 rounded-2xl bg-white py-2"
              style={{
                border: "1px solid var(--border-default)",
                boxShadow: "var(--sh-3)",
                marginTop: "8px",
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(-8px)",
                pointerEvents: menuOpen ? "auto" : "none",
                transition: "opacity 180ms ease, transform 180ms ease",
              }}
            >
              <p className="truncate px-4 py-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>{user?.email}</p>
              <div className="my-1.5 mx-3" style={{ borderTop: "1px solid var(--border-default)" }} />
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-red-50 disabled:opacity-50"
                style={{ color: EMP }}
              >
                {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                {loggingOut ? "Signing out…" : "Logout"}
              </button>
            </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
