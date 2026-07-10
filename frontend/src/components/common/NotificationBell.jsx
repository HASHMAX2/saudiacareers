import { Bell, BellOff, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import { useNotificationStore } from "../../store/notificationStore.js";
import { formatRelativeTime } from "../../utils/formatDate.js";

const POLL_INTERVAL_MS = 30000;

export function NotificationBell({ accent = "var(--accent)" }) {
  const user = useAuthStore((state) => state.user);
  const items = useNotificationStore((state) => state.items);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) close();
    }
    function onEscape(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, close]);

  if (!user) return null;

  function handleItemClick(item) {
    if (!item.isRead) markRead(item.id);
    close();
    if (item.link) navigate(item.link);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-full transition-colors"
        style={{ border: "1px solid var(--border-default)", background: open ? "var(--bg-elev)" : "transparent" }}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
      >
        <Bell size={17} style={{ color: "var(--text-secondary)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: accent }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white"
        style={{
          border: "1px solid var(--border-default)",
          boxShadow: "var(--sh-3)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 180ms ease, transform 180ms ease",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
              style={{ color: accent }}
              type="button"
            >
              <Check size={12} />
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <BellOff size={22} style={{ color: "var(--text-tertiary)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>No notifications yet</p>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-elev)]"
                style={{ borderBottom: "1px solid var(--border-default)" }}
                type="button"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: item.isRead ? "transparent" : accent }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>
                    {item.message}
                  </span>
                  <span className="mt-1 block text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
