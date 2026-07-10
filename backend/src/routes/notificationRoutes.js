import { Router } from "express";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listNotificationsSchema, notificationIdSchema } from "../validation/notificationSchemas.js";

export const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get("/", validate(listNotificationsSchema), asyncHandler(listNotifications));
notificationRouter.patch("/read-all", asyncHandler(markAllNotificationsRead));
notificationRouter.patch("/:id/read", validate(notificationIdSchema), asyncHandler(markNotificationRead));
