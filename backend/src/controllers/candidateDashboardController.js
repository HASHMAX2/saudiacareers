import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function getDashboardStats(req, res) {
  const userId = req.user.id;

  const [user, appliedCount, recentApplications, recommendedJobs] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
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
  const requiredFields = [
    user.name,
    user.mobile,
    profile?.location,
    profile?.designation,
    profile?.experience,
    profile?.skills,
    profile?.education,
    profile?.resumePath,
  ];
  const profileCompletion = Math.round(
    (requiredFields.filter(Boolean).length / requiredFields.length) * 100,
  );

  const missingFields = [];
  if (!profile?.profilePhotoPath)
    missingFields.push({ field: "photo", label: "Profile photo", boost: 5 });
  if (!profile?.resumePath)
    missingFields.push({ field: "resume", label: "Resume", boost: 10 });
  if (!profile?.skills)
    missingFields.push({ field: "skills", label: "Key skills", boost: 8 });
  if (!profile?.education)
    missingFields.push({ field: "education", label: "Education", boost: 5 });
  if (!profile?.summary)
    missingFields.push({
      field: "summary",
      label: "Professional summary",
      boost: 4,
    });

  return sendSuccess(res, {
    message: "Dashboard stats",
    data: {
      profile: {
        name: user.name,
        email: user.email,
        designation: profile?.designation ?? null,
        experience: profile?.experience ?? null,
        profileCompletion,
        hasPhoto: Boolean(profile?.profilePhotoPath),
        missingFields,
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
