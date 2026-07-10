import crypto from "node:crypto";
import path from "node:path";
import { prisma } from "../config/prisma.js";
import {
  createSignedDownloadUrl,
  removePrivateFile,
  uploadPrivateFile,
} from "../services/storageService.js";
import { parseResume } from "../services/resumeParserService.js";
import { notify } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const profileInclude = {
  profile: {
    include: {
      employmentEntries: { orderBy: { startYear: "desc" } },
      educationEntries: { orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }] },
      certifications: { orderBy: { issueYear: "desc" } },
    },
  },
};

const COMPLETION_WEIGHTS = [
  (u, p) => [!!u.name, 5],
  (u, p) => [!!u.mobile, 5],
  (u, p) => [!!p?.location, 5],
  (u, p) => [!!p?.designation, 10],
  (u, p) => [!!p?.experience, 10],
  (u, p) => [!!p?.skills, 10],
  (u, p) => [!!p?.cvHeadline, 5],
  (u, p) => [!!p?.summary, 5],
  (u, p) => [!!p?.profilePhotoPath, 5],
  (u, p) => [!!p?.resumePath, 20],
  (u, p) => [(p?.employmentEntries?.length ?? 0) > 0, 10],
  (u, p) => [(p?.educationEntries?.length ?? 0) > 0, 10],
];

function serializeProfile(user) {
  const p = user.profile;
  const profileCompletion = COMPLETION_WEIGHTS.reduce(
    (acc, fn) => { const [done, pct] = fn(user, p); return acc + (done ? pct : 0); },
    0,
  );
  return {
    id: user.id,
    registeredName: user.name,
    name: p?.displayName || user.name,
    displayName: p?.displayName ?? null,
    email: user.email,
    mobile: user.mobile,
    ...p,
    employmentEntries: p?.employmentEntries ?? [],
    educationEntries: p?.educationEntries ?? [],
    certifications: p?.certifications ?? [],
    profileCompletion,
    isApplicationProfileComplete: Boolean(
      p?.designation && p?.experience && p?.skills,
    ),
  };
}

// ─── Base profile ────────────────────────────────────────────────────────────

export async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: profileInclude,
  });
  const data = serializeProfile(user);
  if (user.profile?.profilePhotoPath) {
    data.profilePhotoUrl = await createSignedDownloadUrl(user.profile.profilePhotoPath);
  }
  return sendSuccess(res, { message: "Profile retrieved", data });
}

export async function updateProfile(req, res) {
  const { mobile, ...profileData } = req.validated.body;
  const normalizedProfile = Object.fromEntries(
    Object.entries(profileData).map(([key, value]) => [key, value || null]),
  );
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(mobile ? { mobile } : {}),
      profile: { upsert: { create: normalizedProfile, update: normalizedProfile } },
    },
    include: profileInclude,
  });
  await notify({
    userId: req.user.id,
    type: "PROFILE_UPDATED",
    title: "Profile updated",
    message: "Your profile changes were saved.",
    link: "/dashboard/profile",
  });
  return sendSuccess(res, { message: "Profile updated", data: serializeProfile(user) });
}

// ─── Photo ───────────────────────────────────────────────────────────────────

export async function uploadProfilePhoto(req, res) {
  if (!req.file) throw new ApiError(422, "Profile photo is required");
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user.id } });
  const extension = path.extname(req.file.originalname).toLowerCase() || ".jpg";
  const photoPath = `avatars/${req.user.id}/${crypto.randomUUID()}${extension}`;
  await uploadPrivateFile(photoPath, req.file.buffer, req.file.mimetype);
  await prisma.candidateProfile.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, profilePhotoPath: photoPath },
    update: { profilePhotoPath: photoPath },
  });
  if (profile?.profilePhotoPath) {
    await removePrivateFile(profile.profilePhotoPath).catch(() => {});
  }
  return sendSuccess(res, { statusCode: 201, message: "Profile photo uploaded" });
}

export async function deleteProfilePhoto(req, res) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile?.profilePhotoPath) throw new ApiError(404, "Profile photo not found");
  await removePrivateFile(profile.profilePhotoPath);
  await prisma.candidateProfile.update({
    where: { userId: req.user.id },
    data: { profilePhotoPath: null },
  });
  return sendSuccess(res, { message: "Profile photo removed" });
}

// ─── Resume ──────────────────────────────────────────────────────────────────

export async function uploadResume(req, res) {
  if (!req.file) throw new ApiError(422, "Resume file is required");
  const existingProfile = await prisma.candidateProfile.findUnique({ where: { userId: req.user.id } });
  const extension = path.extname(req.file.originalname).toLowerCase();
  const resumePath = `resumes/${req.user.id}/${crypto.randomUUID()}${extension}`;
  await uploadPrivateFile(resumePath, req.file.buffer, req.file.mimetype);
  try {
    await prisma.candidateProfile.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, resumePath, resumeFilename: req.file.originalname, resumeUploadedAt: new Date() },
      update: { resumePath, resumeFilename: req.file.originalname, resumeUploadedAt: new Date() },
    });
  } catch (error) {
    await removePrivateFile(resumePath).catch(() => {});
    throw error;
  }
  if (existingProfile?.resumePath) {
    await removePrivateFile(existingProfile.resumePath).catch((e) => console.error("Old resume cleanup failed:", e.message));
  }

  // Parse the resume and auto-save all extracted fields
  const parsedFields = await parseResume(req.file.buffer, req.file.mimetype);

  const {
    employmentEntries: parsedEmployment = [],
    educationEntries: parsedEducation = [],
    certifications: parsedCerts = [],
    name: _ignoredName, // never overwrite the registered name from resume data
    ...flatFields
  } = parsedFields;

  // These fields are always sourced from the resume — always overwrite them (even to null)
  // so stale values from the old CV don't persist after uploading a new one.
  const RESUME_DERIVED_FIELDS = [
    "designation", "cvHeadline", "alternateMobile", "alternateEmail",
    "nationality", "location", "visaStatus", "availabilityToJoin",
    "experience", "skills", "itSkills", "summary", "languagesKnown",
  ];
  const profileUpdate = Object.fromEntries(
    RESUME_DERIVED_FIELDS.map(k => [k, flatFields[k] ?? null]),
  );

  await prisma.candidateProfile.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, ...profileUpdate },
    update: profileUpdate,
  });

  // Get profile id for sub-entries
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user.id } });
  const profileId = profile.id;

  // Always replace sub-entries — delete old ones unconditionally so stale
  // data from a previous CV never persists after a new upload.
  await prisma.employmentEntry.deleteMany({ where: { candidateProfileId: profileId } });
  if (parsedEmployment.length > 0) {
    await prisma.employmentEntry.createMany({
      data: parsedEmployment.map(e => ({ ...e, candidateProfileId: profileId })),
    });
  }

  await prisma.educationEntry.deleteMany({ where: { candidateProfileId: profileId } });
  if (parsedEducation.length > 0) {
    await prisma.educationEntry.createMany({
      data: parsedEducation.map(e => ({ ...e, candidateProfileId: profileId })),
    });
  }

  await prisma.certification.deleteMany({ where: { candidateProfileId: profileId } });
  if (parsedCerts.length > 0) {
    await prisma.certification.createMany({
      data: parsedCerts.map(c => ({ ...c, candidateProfileId: profileId })),
    });
  }

  await notify({
    userId: req.user.id,
    type: "PROFILE_UPDATED",
    title: "CV updated",
    message: "Your resume was uploaded and your profile was refreshed with the new details.",
    link: "/dashboard/profile",
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Resume uploaded and profile updated",
    data: { resumeFilename: req.file.originalname, parsedFields },
  });
}

export async function deleteResume(req, res) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile?.resumePath) throw new ApiError(404, "Resume not found");
  await removePrivateFile(profile.resumePath);
  await prisma.candidateProfile.update({
    where: { userId: req.user.id },
    data: { resumePath: null, resumeFilename: null, resumeUploadedAt: null },
  });
  return sendSuccess(res, { message: "Resume removed" });
}

export async function downloadResume(req, res) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile?.resumePath) throw new ApiError(404, "Resume not found");
  const url = await createSignedDownloadUrl(profile.resumePath);
  return sendSuccess(res, { message: "Resume download URL generated", data: { url, expiresIn: 3600, filename: profile.resumeFilename } });
}

// ─── Employment entries ───────────────────────────────────────────────────────

async function requireProfile(userId) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Profile not found");
  return profile;
}

export async function addEmploymentEntry(req, res) {
  const profile = await requireProfile(req.user.id);
  const { isCurrent, endYear, endMonth, ...rest } = req.validated.body;
  const entry = await prisma.employmentEntry.create({
    data: {
      ...rest,
      candidateProfileId: profile.id,
      isCurrent: isCurrent ?? false,
      endMonth: isCurrent ? null : (endMonth ?? null),
      endYear: isCurrent ? null : (endYear ?? null),
    },
  });
  return sendSuccess(res, { statusCode: 201, message: "Employment entry added", data: entry });
}

export async function updateEmploymentEntry(req, res) {
  const profile = await requireProfile(req.user.id);
  const entry = await prisma.employmentEntry.findFirst({
    where: { id: Number(req.params.id), candidateProfileId: profile.id },
  });
  if (!entry) throw new ApiError(404, "Employment entry not found");
  const { isCurrent, endYear, endMonth, ...rest } = req.validated.body;
  const updated = await prisma.employmentEntry.update({
    where: { id: entry.id },
    data: {
      ...rest,
      ...(isCurrent !== undefined ? { isCurrent } : {}),
      ...(isCurrent ? { endMonth: null, endYear: null } : { endMonth: endMonth ?? undefined, endYear: endYear ?? undefined }),
    },
  });
  return sendSuccess(res, { message: "Employment entry updated", data: updated });
}

export async function deleteEmploymentEntry(req, res) {
  const profile = await requireProfile(req.user.id);
  const entry = await prisma.employmentEntry.findFirst({
    where: { id: Number(req.params.id), candidateProfileId: profile.id },
  });
  if (!entry) throw new ApiError(404, "Employment entry not found");
  await prisma.employmentEntry.delete({ where: { id: entry.id } });
  return sendSuccess(res, { message: "Employment entry removed" });
}

// ─── Education entries ────────────────────────────────────────────────────────

export async function addEducationEntry(req, res) {
  const profile = await requireProfile(req.user.id);
  const entry = await prisma.educationEntry.create({
    data: { ...req.validated.body, candidateProfileId: profile.id },
  });
  return sendSuccess(res, { statusCode: 201, message: "Education entry added", data: entry });
}

export async function updateEducationEntry(req, res) {
  const profile = await requireProfile(req.user.id);
  const entry = await prisma.educationEntry.findFirst({
    where: { id: Number(req.params.id), candidateProfileId: profile.id },
  });
  if (!entry) throw new ApiError(404, "Education entry not found");
  const updated = await prisma.educationEntry.update({ where: { id: entry.id }, data: req.validated.body });
  return sendSuccess(res, { message: "Education entry updated", data: updated });
}

export async function deleteEducationEntry(req, res) {
  const profile = await requireProfile(req.user.id);
  const entry = await prisma.educationEntry.findFirst({
    where: { id: Number(req.params.id), candidateProfileId: profile.id },
  });
  if (!entry) throw new ApiError(404, "Education entry not found");
  await prisma.educationEntry.delete({ where: { id: entry.id } });
  return sendSuccess(res, { message: "Education entry removed" });
}

// ─── Certifications ───────────────────────────────────────────────────────────

export async function addCertification(req, res) {
  const profile = await requireProfile(req.user.id);
  const cert = await prisma.certification.create({
    data: { ...req.validated.body, candidateProfileId: profile.id },
  });
  return sendSuccess(res, { statusCode: 201, message: "Certification added", data: cert });
}

export async function updateCertification(req, res) {
  const profile = await requireProfile(req.user.id);
  const cert = await prisma.certification.findFirst({
    where: { id: Number(req.params.id), candidateProfileId: profile.id },
  });
  if (!cert) throw new ApiError(404, "Certification not found");
  const updated = await prisma.certification.update({ where: { id: cert.id }, data: req.validated.body });
  return sendSuccess(res, { message: "Certification updated", data: updated });
}

export async function deleteCertification(req, res) {
  const profile = await requireProfile(req.user.id);
  const cert = await prisma.certification.findFirst({
    where: { id: Number(req.params.id), candidateProfileId: profile.id },
  });
  if (!cert) throw new ApiError(404, "Certification not found");
  await prisma.certification.delete({ where: { id: cert.id } });
  return sendSuccess(res, { message: "Certification removed" });
}
