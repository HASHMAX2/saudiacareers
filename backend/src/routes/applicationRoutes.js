import { Router } from "express";
import { apply, mine, mineIds } from "../controllers/applicationController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeCandidate } from "../middleware/authorizeAdmin.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { applySchema } from "../validation/applicationSchemas.js";

export const applicationRouter = Router();
applicationRouter.use(authenticate, authorizeCandidate);
applicationRouter.post("/", validate(applySchema), asyncHandler(apply));
applicationRouter.get("/mine/ids", asyncHandler(mineIds));
applicationRouter.get("/mine", asyncHandler(mine));

