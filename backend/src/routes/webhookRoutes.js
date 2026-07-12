import { Router } from "express";
import { handleDodoWebhook } from "../controllers/dodoWebhookController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const webhookRouter = Router();

webhookRouter.post("/dodo", asyncHandler(handleDodoWebhook));
