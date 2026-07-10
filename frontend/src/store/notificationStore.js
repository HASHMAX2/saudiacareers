import { create } from "zustand";
import { notificationsApi } from "../api/notifications.js";

export const useNotificationStore = create((set, get) => ({
  items: [],
  unreadCount: 0,
  loaded: false,

  fetch: async () => {
    try {
      const { data } = await notificationsApi.list({ page: 1, limit: 20 });
      set({ items: data.data.notifications, unreadCount: data.data.unreadCount, loaded: true });
    } catch {
      // guest or network error — ignore silently
    }
  },

  markRead: async (id) => {
    const wasUnread = get().items.find((n) => n.id === id && !n.isRead);
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }));
    try {
      await notificationsApi.markRead(id);
    } catch {
      // best-effort — next fetch() reconciles
    }
  },

  markAllRead: async () => {
    set((state) => ({
      items: state.items.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await notificationsApi.markAllRead();
    } catch {
      // best-effort — next fetch() reconciles
    }
  },

  reset: () => set({ items: [], unreadCount: 0, loaded: false }),
}));
