import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getDashboardStats } from "../controllers/candidateDashboardController.js";
import { getCareerTips } from "../controllers/careerTipsController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const candidateRouter = Router();

candidateRouter.get(
  "/dashboard",
  authenticate,
  asyncHandler(getDashboardStats),
);

candidateRouter.get("/career-tips", asyncHandler(getCareerTips));
