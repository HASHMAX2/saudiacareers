import { prisma } from "../config/prisma.js";

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "live.com", "aol.com", "mail.com", "protonmail.com", "yandex.com",
]);

const ALLOWLISTED_APPLY_DOMAINS = new Set([
  "linkedin.com", "indeed.com", "bayt.com", "greenhouse.io", "lever.co",
  "workday.com", "myworkdayjobs.com", "smartrecruiters.com", "taleo.net",
  "icims.com", "jobs.google.com", "glassdoor.com",
]);

const PAYMENT_FEE_PATTERN = /processing fee|registration fee|training fee|refundable deposit|advance payment|send money|wire transfer|western union|bank details|one[- ]time password|\botp\b/i;

const OFF_PLATFORM_PATTERN = /wa\.me\/|t\.me\/|whatsapp only|telegram only|message (us |me )?on telegram|contact (us )?(only )?on whatsapp/i;

const TOO_GOOD_TO_BE_TRUE_PATTERN = /no experience.{0,25}(high pay|high salary|guaranteed)|guaranteed income|earn (\$|sar|usd).{0,10}(per day|per week|daily|weekly)|earn (money|cash)? ?from home|easy money/i;

const SUSPICIOUS_SALARY_PATTERN = /https?:\/\/|wa\.me|t\.me|\d{7,}/i;

function domainOf(value) {
  if (!value) return null;
  const emailMatch = value.match(/@([^@\s]+)$/);
  if (emailMatch) return emailMatch[1].toLowerCase();
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function checkEmailDomainMismatch(jobData, employerProfile) {
  const reasons = [];
  // Free webmail is never acceptable for a company's HR/apply contact, with or
  // without a website on file — a legitimate company email is mandatory either way.
  // The domain-mismatch comparison, on the other hand, needs a real baseline to
  // compare against, so it only applies when the employer has a website registered.
  const employerDomain = domainOf(employerProfile?.website);

  const hrDomain = domainOf(jobData.hrEmail);
  if (hrDomain && FREE_EMAIL_DOMAINS.has(hrDomain)) {
    reasons.push("HR_EMAIL_FREE_WEBMAIL");
  } else if (hrDomain && employerDomain && hrDomain !== employerDomain) {
    reasons.push("HR_EMAIL_DOMAIN_MISMATCH");
  }

  if (jobData.applyMethod === "EMAIL" && jobData.applyContact) {
    const applyDomain = domainOf(jobData.applyContact);
    if (applyDomain && FREE_EMAIL_DOMAINS.has(applyDomain)) {
      reasons.push("APPLY_EMAIL_FREE_WEBMAIL");
    } else if (applyDomain && employerDomain && applyDomain !== employerDomain) {
      reasons.push("APPLY_EMAIL_DOMAIN_MISMATCH");
    }
  }

  return reasons;
}

function checkExternalApplyUrl(jobData, employerProfile) {
  if (jobData.applyMethod !== "EXTERNAL_URL" || !jobData.applyContact) return [];
  const applyDomain = domainOf(jobData.applyContact);
  const employerDomain = domainOf(employerProfile?.website);
  if (!applyDomain) return [];
  if (applyDomain === employerDomain || ALLOWLISTED_APPLY_DOMAINS.has(applyDomain)) return [];
  return ["EXTERNAL_APPLY_URL_UNRECOGNIZED_DOMAIN"];
}

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
  const normalizedDescription = jobData.description?.trim().toLowerCase();

  const duplicateCount = recentJobs.filter(
    (job) => job.title.trim().toLowerCase() === normalizedTitle
      && job.description.trim().toLowerCase() === normalizedDescription,
  ).length;

  return duplicateCount >= 2 ? ["RAPID_DUPLICATE_POSTINGS"] : [];
}

// Hard-block reasons: content that is itself unacceptable, regardless of who posted it.
const AUTO_BLOCK_REASONS = new Set(["PAYMENT_FEE_LANGUAGE", "SUSPICIOUS_SALARY_CONTENT"]);

export async function checkJobLegitimacy(jobData, employerProfile, userId) {
  const reasons = [
    ...checkEmailDomainMismatch(jobData, employerProfile),
    ...checkExternalApplyUrl(jobData, employerProfile),
    ...checkTextContent(jobData),
    ...(await checkDuplicatePostings(jobData, userId)),
  ];

  return {
    flagged: reasons.length > 0,
    autoBlocked: reasons.some((reason) => AUTO_BLOCK_REASONS.has(reason)),
    reasons,
  };
}
