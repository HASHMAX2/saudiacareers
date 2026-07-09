import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function listEmployers(req, res) {
  const { page, limit, search, status, planTier } = req.validated.query;

  const where = {
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: "insensitive" } },
            { website: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(status === "SUSPENDED"
      ? { isSuspended: true }
      : status
        ? { isSuspended: false, verificationStatus: status }
        : {}),
    ...(planTier ? { subscription: { planTier } } : {}),
  };

  const [profiles, total] = await prisma.$transaction([
    prisma.employerProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        subscription: { select: { planTier: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.employerProfile.count({ where }),
  ]);

  const jobCounts = await prisma.job.groupBy({
    by: ["createdBy"],
    where: { createdBy: { in: profiles.map((p) => p.userId) }, isDeleted: false },
    _count: { id: true },
  });
  const jobCountByUserId = new Map(jobCounts.map((row) => [row.createdBy, row._count.id]));
  const employers = profiles.map((p) => ({ ...p, jobCount: jobCountByUserId.get(p.userId) ?? 0 }));

  return sendSuccess(res, {
    message: "Employers retrieved",
    data: { employers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

export async function suspendEmployer(req, res) {
  const { id } = req.validated.params;
  const { reason } = req.validated.body;

  const profile = await prisma.employerProfile.findUnique({ where: { id } });
  if (!profile) throw new ApiError(404, "Employer not found");

  const updated = await prisma.employerProfile.update({
    where: { id },
    data: { isSuspended: true, suspendedReason: reason, suspendedAt: new Date() },
  });
  return sendSuccess(res, { message: "Employer suspended", data: updated });
}

export async function unsuspendEmployer(req, res) {
  const { id } = req.validated.params;
  const profile = await prisma.employerProfile.findUnique({ where: { id } });
  if (!profile) throw new ApiError(404, "Employer not found");

  const updated = await prisma.employerProfile.update({
    where: { id },
    data: { isSuspended: false, suspendedReason: null, suspendedAt: null },
  });
  return sendSuccess(res, { message: "Employer unsuspended", data: updated });
}
