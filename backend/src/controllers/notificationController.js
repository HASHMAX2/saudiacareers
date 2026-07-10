import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function listNotifications(req, res) {
  const userId = req.user.id;
  const { page, limit } = req.validated.query;

  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return sendSuccess(res, {
    message: "Notifications retrieved",
    data: { notifications, unreadCount, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

export async function markNotificationRead(req, res) {
  const { id } = req.validated.params;
  const result = await prisma.notification.updateMany({
    where: { id, userId: req.user.id },
    data: { isRead: true },
  });
  if (!result.count) throw new ApiError(404, "Notification not found");
  return sendSuccess(res, { message: "Notification marked as read" });
}

export async function markAllNotificationsRead(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  return sendSuccess(res, { message: "All notifications marked as read" });
}
