import { JobStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

function serializeJob(job) {
  return {
    ...job,
    isClosed: Boolean(job.applicationDeadline && job.applicationDeadline < new Date()),
  };
}

function parseList(csv) {
  return csv ? csv.split("|").map((v) => v.trim()).filter(Boolean) : [];
}

export async function getFilterOptions(req, res) {
  const baseWhere = { status: JobStatus.ACTIVE, isDeleted: false };
  const [industries, nationalities] = await Promise.all([
    prisma.job.findMany({
      where: baseWhere,
      select: { industry: true },
      distinct: ["industry"],
      orderBy: { industry: "asc" },
    }),
    prisma.job.findMany({
      where: { ...baseWhere, nationality: { not: null } },
      select: { nationality: true },
      distinct: ["nationality"],
      orderBy: { nationality: "asc" },
    }),
  ]);
  return sendSuccess(res, {
    message: "Filter options retrieved",
    data: {
      industries: industries.map((j) => j.industry).filter(Boolean).sort(),
      nationalities: nationalities
        .map((j) => j.nationality)
        .filter((v) => v && v !== "Any Nationality" && v !== "Any")
        .sort(),
    },
  });
}

export async function listJobs(req, res) {
  const { page, limit, locations, industries, employmentTypes, experiences, salaries, genders, nationalities, postedAfter, postedBefore, sort } = req.validated.query;
  const now = new Date();

  const locationsList       = parseList(locations);
  const industriesList      = parseList(industries);
  const employmentTypesList = parseList(employmentTypes);
  const experiencesList     = parseList(experiences);
  const salariesList        = parseList(salaries);
  const gendersList         = parseList(genders);
  const nationalitiesList   = parseList(nationalities);

  const conditions = [
    { status: JobStatus.ACTIVE },
    { isDeleted: false },
    { OR: [{ applicationDeadline: null }, { applicationDeadline: { gt: now } }] },
  ];

  if (locationsList.length)       conditions.push({ location: { in: locationsList } });
  if (industriesList.length)      conditions.push({ industry: { in: industriesList } });
  if (employmentTypesList.length) conditions.push({ employmentType: { in: employmentTypesList } });
  if (salariesList.length)        conditions.push({ salaryRange: { in: salariesList } });

  if (experiencesList.length) {
    conditions.push({ OR: experiencesList.map((exp) => ({ experienceRequired: { contains: exp, mode: "insensitive" } })) });
  }

  if (postedBefore) {
    const cutoff = new Date(postedBefore);
    if (!isNaN(cutoff)) conditions.push({ createdAt: { lt: cutoff } });
  } else if (postedAfter) {
    const cutoff = new Date(postedAfter);
    if (!isNaN(cutoff)) conditions.push({ createdAt: { gte: cutoff } });
  }

  if (gendersList.length) {
    const specificGenders = gendersList.filter((g) => g !== "Any");
    const anySelected     = gendersList.includes("Any");
    if (specificGenders.length) {
      // Male / Female selected → also surface "Any" (open-to-all) jobs
      conditions.push({ OR: [{ gender: null }, { gender: "Any" }, { gender: { in: specificGenders } }] });
    } else if (anySelected) {
      // Only "Any" selected → show only open-to-all jobs, not gender-specific ones
      conditions.push({ OR: [{ gender: null }, { gender: "Any" }] });
    }
  }

  if (nationalitiesList.length) {
    conditions.push({
      OR: [{ nationality: null }, { nationality: "Any Nationality" }, { nationality: { in: nationalitiesList } }],
    });
  }

  const where = { AND: conditions };

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
        gender: true,
        nationality: true,
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
  return sendSuccess(res, { message: "Job retrieved", data: serializeJob(job) });
}
