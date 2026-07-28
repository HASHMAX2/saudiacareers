import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { assertPublicHttpUrl } from "../utils/publicUrlGuard.js";

const MAX_REDIRECTS = 5;

// Never lets fetch auto-follow redirects (SA-05) — an initially-public URL
// could still redirect server-side into an internal address. Each hop's
// target is re-validated with the same public-URL guard before it's ever
// requested.
async function fetchIsLive(startUrl) {
  let currentUrl = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHttpUrl(currentUrl);
    const response = await fetch(currentUrl, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(8000) });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return response.ok;
  }
  return false; // too many redirects
}

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
    isLive = await fetchIsLive(scrapedJob.applyUrl);
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
