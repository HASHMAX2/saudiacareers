import { Router } from "express";
import { getCompanyProfile } from "../controllers/companyController.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { companyParamsSchema } from "../validation/companySchemas.js";

export const companyRouter = Router();
companyRouter.get("/:type/:id", validate(companyParamsSchema), asyncHandler(getCompanyProfile));
