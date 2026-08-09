import { JobStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { expireOverdueJobs } from "../services/jobExpiryService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// A job's "company" can come from either a real registered employer account
// (creator.employerProfile) or, for admin-imported/scraped listings with no
// such account, a standalone CompanyProfile row. Normalized to one shape so
// the frontend ("About the employer" on the job detail page, the company
// profile page) doesn't need to know which source it came from.
function normalizeEmployer(employerProfile, companyProfile) {
  if (employerProfile) {
    return {
      companyName: employerProfile.companyName,
      description: employerProfile.description,
      website: employerProfile.website,
      linkedinUrl: employerProfile.linkedinUrl,
    };
  }
  if (companyProfile) {
    return {
      companyName: companyProfile.name,
      description: companyProfile.description,
      website: companyProfile.website,
      linkedinUrl: null,
    };
  }
  return null;
}

// Both source tables auto-increment their own `id` independently, so a bare
// numeric id is ambiguous — the link always carries which table it resolves
// against. `null` means the job has no linkable company (no employer account,
// no CompanyProfile row) and the frontend should render plain text instead.
function companyProfileLink(employerProfileId, companyProfileId) {
  if (employerProfileId) return { type: "employer", id: employerProfileId };
  if (companyProfileId) return { type: "lead", id: companyProfileId };
  return null;
}

// Job detail page — includes the full "About the employer" payload.
function serializeJobDetail(job) {
  const { creator, companyProfile, companyProfileId, ...rest } = job;
  return {
    ...rest,
    isClosed: Boolean(job.applicationDeadline && job.applicationDeadline < new Date()),
    employer: normalizeEmployer(creator?.employerProfile, companyProfile),
    companyProfileLink: companyProfileLink(creator?.employerProfile?.id, companyProfileId),
  };
}

// Job listing cards — a lightweight link descriptor (not the full payload)
// to keep the paginated list response lean.
export function serializeJobCard(job) {
  const { creator, companyProfileId, ...rest } = job;
  return {
    ...rest,
    isClosed: Boolean(job.applicationDeadline && job.applicationDeadline < new Date()),
    companyProfileLink: companyProfileLink(creator?.employerProfile?.id, companyProfileId),
  };
}

// Shared select shape for job cards — reused by the company profile page's
// "Open positions" section so both surfaces render identically.
export const JOB_CARD_SELECT = {
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
  companyProfileId: true,
  creator: { select: { employerProfile: { select: { id: true } } } },
};

function parseList(csv) {
  return csv ? csv.split("|").map((v) => v.trim()).filter(Boolean) : [];
}

export async function reportJob(req, res) {
  const { id } = req.validated.params;
  const { reason, note } = req.validated.body;

  const job = await prisma.job.findFirst({ where: { id, isDeleted: false } });
  if (!job) throw new ApiError(404, "Job not found");

  const report = await prisma.jobReport.create({
    data: { jobId: id, userId: req.user.id, reason, note },
  });
  return sendSuccess(res, { statusCode: 201, message: "Report submitted — our team will review this listing", data: report });
}

export async function getFilterOptions(req, res) {
  const now = new Date();
  const baseWhere = {
    status: JobStatus.ACTIVE,
    isDeleted: false,
    OR: [{ applicationDeadline: null }, { applicationDeadline: { gt: now } }],
  };

  const [industryGroups, nationalities] = await Promise.all([
    prisma.job.groupBy({
      by: ["industry"],
      where: baseWhere,
      _count: { id: true },
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
      industries: industryGroups
        .filter((g) => g.industry)
        .sort((a, b) => a.industry.localeCompare(b.industry))
        .map((g) => ({ name: g.industry, count: g._count.id })),
      nationalities: nationalities
        .map((j) => j.nationality)
        .filter((v) => v && v !== "Any Nationality" && v !== "Any")
        .sort(),
    },
  });
}

export async function listJobs(req, res) {
  await expireOverdueJobs();
  const { page, limit, q, locations, industries, employmentTypes, experiences, salaries, genders, nationalities, postedAfter, postedBefore, sort } = req.validated.query;
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

  if (q) {
    conditions.push({
      OR: [
        { title:          { contains: q, mode: "insensitive" } },
        { companyName:    { contains: q, mode: "insensitive" } },
        { requiredSkills: { contains: q, mode: "insensitive" } },
        { industry:       { contains: q, mode: "insensitive" } },
      ],
    });
  }

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
      ? [{ applicationDeadline: { sort: "asc", nulls: "last" } }, { id: "desc" }]
      : [{ createdAt: "desc" }, { id: "desc" }];

  const [jobs, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: JOB_CARD_SELECT,
    }),
    prisma.job.count({ where }),
  ]);

  return sendSuccess(res, {
    message: "Jobs retrieved",
    data: {
      jobs: jobs.map(serializeJobCard),
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
    include: {
      creator: {
        select: {
          employerProfile: {
            select: { id: true, companyName: true, description: true, website: true, linkedinUrl: true },
          },
        },
      },
      companyProfile: {
        select: { name: true, description: true, website: true },
      },
    },
  });
  if (!job) throw new ApiError(404, "Job not found");
  return sendSuccess(res, { message: "Job retrieved", data: serializeJobDetail(job) });
}
