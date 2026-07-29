import { prisma } from "../config/prisma.js";

const PAYMENT_FEE_PATTERN = /processing fee|registration fee|training fee|refundable deposit|advance payment|send money|wire transfer|western union|bank details|one[- ]time password|\botp\b/i;

const OFF_PLATFORM_PATTERN = /wa\.me\/|t\.me\/|whatsapp only|telegram only|message (us |me )?on telegram|contact (us )?(only )?on whatsapp/i;

const TOO_GOOD_TO_BE_TRUE_PATTERN = /no experience.{0,25}(high pay|high salary|guaranteed)|guaranteed income|earn (\$|sar|usd).{0,10}(per day|per week|daily|weekly)|earn (money|cash)? ?from home|easy money/i;

const SUSPICIOUS_SALARY_PATTERN = /https?:\/\/|wa\.me|t\.me|\d{7,}/i;

function checkTextContent(jobData) {
  const reasons = [];
  const text = `${jobData.description ?? ""} ${jobData.screeningQuestion ?? ""}`;

  if (PAYMENT_FEE_PATTERN.test(text)) reasons.push("PAYMENT_FEE_LANGUAGE");
  if (OFF_PLATFORM_PATTERN.test(text)) reasons.push("OFF_PLATFORM_CONTACT_PRESSURE");
  if (jobData.salaryRange && TOO_GOOD_TO_BE_TRUE_PATTERN.test(text)) reasons.push("TOO_GOOD_TO_BE_TRUE_COMPENSATION");
  if (jobData.salaryRange && SUSPICIOUS_SALARY_PATTERN.test(jobData.salaryRange)) reasons.push("SUSPICIOUS_SALARY_CONTENT");

  return reasons;
}

async function checkDuplicatePostings(jobData, userId) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentJobs = await prisma.job.findMany({
    where: { createdBy: userId, isDeleted: false, createdAt: { gte: since } },
    select: { title: true, description: true },
  });

  const normalizedTitle = jobData.title?.trim().toLowerCase();
  const normalizedDescription = jobData.description?.trim().toLowerCase() ?? "";

  const duplicateCount = recentJobs.filter(
    (job) => job.title?.trim().toLowerCase() === normalizedTitle
      && (job.description?.trim().toLowerCase() ?? "") === normalizedDescription,
  ).length;

  return duplicateCount >= 2 ? ["RAPID_DUPLICATE_POSTINGS"] : [];
}

// Hard-block reasons: content that is itself unacceptable, regardless of who posted it.
const AUTO_BLOCK_REASONS = new Set(["PAYMENT_FEE_LANGUAGE", "SUSPICIOUS_SALARY_CONTENT"]);

export async function checkJobLegitimacy(jobData, userId) {
  const reasons = [
    ...checkTextContent(jobData),
    ...(await checkDuplicatePostings(jobData, userId)),
  ];

  return {
    flagged: reasons.length > 0,
    autoBlocked: reasons.some((reason) => AUTO_BLOCK_REASONS.has(reason)),
    reasons,
  };
}
