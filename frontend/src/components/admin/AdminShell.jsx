import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Briefcase, Building2, ChevronDown, ClipboardList, CreditCard, FileWarning,
  Import, Layers, LayoutDashboard, Loader2, LogOut, Menu, Receipt, RotateCcw,
  Search, ShieldCheck, Wallet, X,
} from "lucide-react";
import { adminApi } from "../../api/admin.js";
import { authApi } from "../../api/auth.js";
import { useAuthStore } from "../../store/authStore.js";
import { Toast } from "../common/Toast.jsx";

const ACCENT = "var(--accent)";
const ACCENT_SUBTLE = "var(--accent-subtle)";
const LOGOUT_DELAY = 1500;

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, end: true },
      { label: "Employer approvals", icon: ShieldCheck, to: "/admin/verifications", countKey: "pendingApprovals" },
      { label: "Employers", to: "/admin/employers", icon: Building2 },
    ],
  },
  {
    label: "Jobs",
    items: [
      { label: "Posted jobs", to: "/admin/jobs", icon: Briefcase, end: true },
      { label: "Job reviews", to: "/admin/job-reviews", icon: ClipboardList, countKey: "jobReviews" },
      { label: "Flagged jobs", to: "/admin/jobs-flagged", icon: FileWarning, countKey: "flaggedJobs" },
      { label: "Scraped jobs", to: "/admin/scraped-jobs", icon: Layers },
      { label: "Import jobs", to: "/admin/jobs/import", icon: Import },
    ],
  },
  {
    label: "Applications",
    items: [
      { label: "Applications", to: "/admin/applications", icon: FileWarning, end: true },
    ],
  },
  {
    label: "Billing",
    items: [
      { label: "Billing", to: "/admin/billing", icon: Wallet },
      { label: "Plans", to: "/admin/plans", icon: CreditCard },
      { label: "Invoices", to: "/admin/invoices", icon: Receipt },
      { label: "Refunds", to: "/admin/refunds", icon: RotateCcw, countKey: "refunds" },
    ],
  },
];

export function AdminShell() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  const [counts, setCounts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const menuRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    Promise.all([
      adminApi.pendingVerifications({ page: 1, limit: 1 }),
      adminApi.jobs({ status: "PENDING_REVIEW", page: 1, limit: 1 }),
      adminApi.flaggedJobs(),
      adminApi.invoices({ status: "REFUND_REQUESTED", page: 1, limit: 1 }),
    ]).then(([verRes, reviewRes, flaggedRes, refundRes]) => {
      setCounts({
        pendingApprovals: verRes.data.data.pagination.total,
        jobReviews: reviewRes.data.data.pagination.total,
        flaggedJobs: flaggedRes.data.data.length,
        refunds: refundRes.data.data.pagination.total,
      });
    }).catch(() => {});
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
      navigate("/admin/login");
      clearSession();
      setLoggingOut(false);
    }, LOGOUT_DELAY);
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/admin/employers?search=${encodeURIComponent(q)}` : "/admin/employers");
    setSidebarOpen(false);
  }

  const initials = (user?.name ?? "A").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

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
        className={`fixed z-40 flex h-screen w-[270px] shrink-0 flex-col gap-4 overflow-y-auto p-4 transition-transform duration-200 md:sticky md:top-0 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--bg-white)", borderRight: "1px solid var(--border-default)" }}
      >
        <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--border-default)" }}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white" style={{ background: ACCENT }}>S</span>
          <div>
            <p className="text-[15px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>SaudiaCareers</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Admin console</p>
          </div>
          <button className="ml-auto rounded-lg p-1.5 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} style={{ color: "var(--text-tertiary)" }} />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--green-bg)" }}>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--green)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--green)" }}>Production · admin-only</span>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{group.label}</p>
              <div className="flex flex-col gap-1">
                {group.items.map(({ label, to, icon: Icon, end, countKey }) => {
                  const count = countKey ? counts[countKey] : undefined;
                  const badgePill = typeof count === "number" && count > 0 && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: ACCENT_SUBTLE, color: ACCENT }}>
                      {count}
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
                      style={({ isActive }) => ({ background: isActive ? ACCENT : "transparent", color: isActive ? "#fff" : "var(--text-secondary)" })}
                    >
                      <Icon size={17} className="shrink-0" />
                      <span className="flex-1">{label}</span>
                      {badgePill}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
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

          <form onSubmit={handleSearch} className="relative hidden max-w-md flex-1 md:block">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              className="w-full rounded-full py-2 pl-10 pr-4 text-sm outline-none"
              style={{ border: "1px solid var(--border-default)", background: "var(--bg-elev)" }}
              placeholder="Search employers, domains…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="relative ml-auto" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[15px] font-semibold transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                background: menuOpen ? ACCENT_SUBTLE : "transparent",
                color: "var(--text-primary)",
              }}
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white" style={{ background: ACCENT }}>
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
                style={{ color: ACCENT }}
              >
                {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                {loggingOut ? "Signing out…" : "Logout"}
              </button>
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
