import { prisma } from "../config/prisma.js";
import { createSignedViewUrl } from "../services/storageService.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function getDashboardStats(req, res) {
  const userId = req.user.id;

  const [user, appliedCount, recentApplications, recommendedJobs] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              _count: { select: { employmentEntries: true, educationEntries: true } },
            },
          },
        },
      }),
      prisma.application.count({ where: { userId } }),
      prisma.application.findMany({
        where: { userId },
        orderBy: { appliedAt: "desc" },
        take: 10,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              companyName: true,
              location: true,
              experienceRequired: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.job.findMany({
        where: { status: "ACTIVE", isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          title: true,
          companyName: true,
          location: true,
          experienceRequired: true,
          industry: true,
          employmentType: true,
          salaryRange: true,
          createdAt: true,
          applicationDeadline: true,
        },
      }),
    ]);

  const profile = user.profile;

  // Weighted formula — must mirror COMPLETION_ITEMS in Profile.jsx
  const completionWeights = [
    { pct: 5,  filled: !!user.name },
    { pct: 5,  filled: !!user.mobile },
    { pct: 5,  filled: !!(profile?.country || profile?.city) },
    { pct: 10, filled: !!profile?.designation },
    { pct: 10, filled: !!profile?.experience },
    { pct: 10, filled: !!profile?.skills },
    { pct: 5,  filled: !!profile?.cvHeadline },
    { pct: 5,  filled: !!profile?.summary },
    { pct: 5,  filled: !!profile?.profilePhotoPath },
    { pct: 20, filled: !!profile?.resumePath },
    { pct: 10, filled: (profile?._count?.employmentEntries ?? 0) > 0 },
    { pct: 10, filled: (profile?._count?.educationEntries ?? 0) > 0 },
  ];
  const profileCompletion = completionWeights.reduce((acc, { pct, filled }) => acc + (filled ? pct : 0), 0);

  const missingFields = [];
  if (!profile?.profilePhotoPath)
    missingFields.push({ field: "photo", label: "Profile photo", boost: 5 });
  if (!profile?.resumePath)
    missingFields.push({ field: "resume", label: "Resume", boost: 20 });
  if (!profile?.skills)
    missingFields.push({ field: "skills", label: "Key skills", boost: 10 });
  if ((profile?._count?.educationEntries ?? 0) === 0)
    missingFields.push({ field: "education", label: "Education details", boost: 10 });
  if (!profile?.summary)
    missingFields.push({ field: "summary", label: "Professional summary", boost: 5 });

  let profilePhotoUrl = null;
  if (profile?.profilePhotoPath) {
    try {
      profilePhotoUrl = await createSignedViewUrl(profile.profilePhotoPath, 3600);
    } catch {
      // non-fatal — dashboard still loads without photo
    }
  }

  return sendSuccess(res, {
    message: "Dashboard stats",
    data: {
      profile: {
        name: user.name,
        email: user.email,
        designation: profile?.designation ?? null,
        experience: profile?.experience ?? null,
        profileCompletion,
        profilePhotoUrl,
        missingFields,
        updatedAt: profile?.updatedAt ?? null,
      },
      stats: {
        appliedCount,
        messagesCount: 0,
        searchAppearances: 0,
        employerActions: 0,
      },
      recentApplications,
      recommendedJobs,
    },
  });
}
