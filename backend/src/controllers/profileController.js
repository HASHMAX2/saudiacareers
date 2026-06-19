import crypto from "node:crypto";
import path from "node:path";
import { prisma } from "../config/prisma.js";
import {
  createSignedDownloadUrl,
  removePrivateFile,
  uploadPrivateFile,
} from "../services/storageService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const profileInclude = {
  profile: true,
};

function serializeProfile(user) {
  const required = [
    user.name,
    user.mobile,
    user.profile?.location,
    user.profile?.designation,
    user.profile?.experience,
    user.profile?.skills,
    user.profile?.education,
    user.profile?.resumePath,
  ];
  const completed = required.filter(Boolean).length;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    ...user.profile,
    profileCompletion: Math.round((completed / required.length) * 100),
    isApplicationProfileComplete: Boolean(
      user.profile?.designation &&
        user.profile?.experience &&
        user.profile?.skills,
    ),
  };
}

export async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: profileInclude,
  });
  const data = serializeProfile(user);
  if (user.profile?.profilePhotoPath) {
    data.profilePhotoUrl = await createSignedDownloadUrl(
      user.profile.profilePhotoPath,
    );
  }
  return sendSuccess(res, {
    message: "Profile retrieved",
    data,
  });
}

export async function uploadProfilePhoto(req, res) {
  if (!req.file) throw new ApiError(422, "Profile photo is required");
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });
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
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!profile?.profilePhotoPath) throw new ApiError(404, "Profile photo not found");
  await removePrivateFile(profile.profilePhotoPath);
  await prisma.candidateProfile.update({
    where: { userId: req.user.id },
    data: { profilePhotoPath: null },
  });
  return sendSuccess(res, { message: "Profile photo removed" });
}

export async function updateProfile(req, res) {
  const { name, mobile, ...profileData } = req.validated.body;
  const normalizedProfile = Object.fromEntries(
    Object.entries(profileData).map(([key, value]) => [key, value || null]),
  );

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name ? { name } : {}),
      ...(mobile ? { mobile } : {}),
      profile: {
        upsert: {
          create: normalizedProfile,
          update: normalizedProfile,
        },
      },
    },
    include: profileInclude,
  });
  return sendSuccess(res, {
    message: "Profile updated",
    data: serializeProfile(user),
  });
}

export async function uploadResume(req, res) {
  if (!req.file) throw new ApiError(422, "Resume file is required");
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });
  const extension = path.extname(req.file.originalname).toLowerCase();
  const resumePath = `resumes/${req.user.id}/${crypto.randomUUID()}${extension}`;

  await uploadPrivateFile(resumePath, req.file.buffer, req.file.mimetype);
  try {
    await prisma.candidateProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        resumePath,
        resumeFilename: req.file.originalname,
        resumeUploadedAt: new Date(),
      },
      update: {
        resumePath,
        resumeFilename: req.file.originalname,
        resumeUploadedAt: new Date(),
      },
    });
  } catch (error) {
    await removePrivateFile(resumePath).catch(() => {});
    throw error;
  }

  if (profile?.resumePath) {
    await removePrivateFile(profile.resumePath).catch((error) =>
      console.error("Old resume cleanup failed:", error.message),
    );
  }
  return sendSuccess(res, {
    statusCode: 201,
    message: "Resume uploaded",
    data: { resumeFilename: req.file.originalname },
  });
}

export async function deleteResume(req, res) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!profile?.resumePath) throw new ApiError(404, "Resume not found");

  await removePrivateFile(profile.resumePath);
  await prisma.candidateProfile.update({
    where: { userId: req.user.id },
    data: {
      resumePath: null,
      resumeFilename: null,
      resumeUploadedAt: null,
    },
  });
  return sendSuccess(res, { message: "Resume removed" });
}

export async function downloadResume(req, res) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!profile?.resumePath) throw new ApiError(404, "Resume not found");
  const url = await createSignedDownloadUrl(profile.resumePath);
  return sendSuccess(res, {
    message: "Resume download URL generated",
    data: { url, expiresIn: 3600, filename: profile.resumeFilename },
  });
}
