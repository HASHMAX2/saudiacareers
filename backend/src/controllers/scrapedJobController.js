import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function listScrapedJobs(req, res) {
  const { page, limit, search, status } = req.validated.query;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { companyName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [scrapedJobs, total, live, broken, duplicateSuspects] = await prisma.$transaction([
    prisma.scrapedJob.findMany({
      where,
      orderBy: { lastCheckedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scrapedJob.count({ where }),
    prisma.scrapedJob.count({ where: { status: "LIVE" } }),
    prisma.scrapedJob.count({ where: { status: "BROKEN" } }),
    prisma.scrapedJob.count({ where: { isDuplicateSuspect: true } }),
  ]);

  return sendSuccess(res, {
    message: "Scraped jobs retrieved",
    data: {
      scrapedJobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      kpis: { live, broken, duplicateSuspects },
    },
  });
}

export async function createScrapedJob(req, res) {
  const scrapedJob = await prisma.scrapedJob.create({ data: req.validated.body });
  return sendSuccess(res, { statusCode: 201, message: "Scraped job added", data: scrapedJob });
}

export async function recrawlScrapedJob(req, res) {
  const { id } = req.validated.params;
  const scrapedJob = await prisma.scrapedJob.findUnique({ where: { id } });
  if (!scrapedJob) throw new ApiError(404, "Scraped job not found");

  let isLive = false;
  try {
    const response = await fetch(scrapedJob.applyUrl, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(8000) });
    isLive = response.ok;
  } catch {
    isLive = false;
  }

  const updated = await prisma.scrapedJob.update({
    where: { id },
    data: { status: isLive ? "LIVE" : "BROKEN", lastCheckedAt: new Date() },
  });
  return sendSuccess(res, {
    message: isLive ? "Link is live — status updated" : "Link appears broken — marked and hidden from candidates",
    data: updated,
  });
}

export async function markDuplicateReviewed(req, res) {
  const { id } = req.validated.params;
  const result = await prisma.scrapedJob.updateMany({ where: { id }, data: { isDuplicateSuspect: false } });
  if (!result.count) throw new ApiError(404, "Scraped job not found");
  return sendSuccess(res, { message: "Marked as reviewed — no longer flagged as a duplicate" });
}
