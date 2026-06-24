import { JobStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

function serializeJob(job) {
  return {
    ...job,
    isClosed: Boolean(
      job.applicationDeadline && job.applicationDeadline < new Date(),
    ),
  };
}

export async function listJobs(req, res) {
  const {
    page,
    limit,
    search,
    location,
    industry,
    experience,
    employmentType,
    sort,
  } = req.validated.query;
  const now = new Date();
  const where = {
    status: JobStatus.ACTIVE,
    isDeleted: false,
    OR: [
      { applicationDeadline: null },
      { applicationDeadline: { gt: now } },
    ],
    ...(location ? { location } : {}),
    ...(industry ? { industry } : {}),
    ...(experience ? { experienceRequired: experience } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { companyName: { contains: search, mode: "insensitive" } },
            { requiredSkills: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy =
    sort === "deadline"
      ? [{ applicationDeadline: { sort: "asc", nulls: "last" } }]
      : [{ createdAt: "desc" }];
  const [jobs, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
        createdAt: true,
      },
    }),
    prisma.job.count({ where }),
  ]);
  return sendSuccess(res, {
    message: "Jobs retrieved",
    data: {
      jobs: jobs.map(serializeJob),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
}

export async function getJob(req, res) {
  const job = await prisma.job.findFirst({
    where: {
      id: req.validated.params.id,
      status: JobStatus.ACTIVE,
      isDeleted: false,
    },
  });
  if (!job) throw new ApiError(404, "Job not found");
  return sendSuccess(res, {
    message: "Job retrieved",
    data: serializeJob(job),
  });
}

