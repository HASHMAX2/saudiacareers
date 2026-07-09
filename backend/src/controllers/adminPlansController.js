import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function listPlansAdmin(req, res) {
  const plans = await prisma.plan.findMany({ orderBy: { priceSar: "asc" } });
  return sendSuccess(res, { message: "Plans retrieved", data: plans });
}

export async function updatePlan(req, res) {
  const { id } = req.validated.params;
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Plan not found");

  const updated = await prisma.plan.update({ where: { id }, data: req.validated.body });
  return sendSuccess(res, { message: "Plan updated", data: updated });
}
