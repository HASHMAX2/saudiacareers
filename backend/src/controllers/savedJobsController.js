import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function saveJob(req, res) {
  const jobId = req.validated.body.jobId;
  const userId = req.user.id;

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
  if (!job) throw new ApiError(404, "Job not found");

  await prisma.savedJob.upsert({
    where: { userId_jobId: { userId, jobId } },
    create: { userId, jobId },
    update: {},
  });

  return sendSuccess(res, { message: "Job saved", data: { saved: true } });
}

export async function unsaveJob(req, res) {
  const jobId = req.validated.params.jobId;
  const userId = req.user.id;

  await prisma.savedJob.deleteMany({ where: { userId, jobId } });
  return sendSuccess(res, { message: "Job unsaved", data: { saved: false } });
}

export async function getSavedJobs(req, res) {
  const userId = req.user.id;
  const now = new Date();

  const saved = await prisma.savedJob.findMany({
    where: { userId },
    orderBy: { savedAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          companyName: true,
          location: true,
          industry: true,
          employmentType: true,
          experienceRequired: true,
          salaryRange: true,
          requiredSkills: true,
          applicationDeadline: true,
          status: true,
          isDeleted: true,
          createdAt: true,
        },
      },
    },
  });

  const data = saved.map(({ savedAt, job }) => ({
    ...job,
    savedAt,
    isClosed: Boolean(job.applicationDeadline && job.applicationDeadline < now),
  }));

  return sendSuccess(res, { message: "Saved jobs retrieved", data });
}

export async function getSavedIds(req, res) {
  const userId = req.user.id;

  const saved = await prisma.savedJob.findMany({
    where: { userId },
    select: { jobId: true },
  });

  return sendSuccess(res, { message: "Saved IDs retrieved", data: saved.map((s) => s.jobId) });
}
