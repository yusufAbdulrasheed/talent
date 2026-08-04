import { z } from 'zod';
import Candidate from '../models/candidate.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

const profileSchema = z.object({
  phoneNumber: z.string().trim().min(7).max(40).optional(),
  gender: z.enum(['female', 'male', 'prefer_not_to_say']).optional(),
  dateOfBirth: z.coerce.date().optional(),
  location: z.string().trim().min(2).max(160).optional(),
  education: z.string().trim().max(1000).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  certifications: z.array(z.string().trim().min(1).max(160)).max(30).optional(),
  workExperience: z.string().trim().max(4000).optional(),
  availability: z.enum(['immediate', 'two_weeks', 'one_month', 'not_available']).optional(),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior']).optional(),
}).strict();

function serializeCandidate(candidate) {
  return {
    id: candidate.id,
    referenceNumber: candidate.referenceNumber,
    phoneNumber: candidate.phoneNumber,
    gender: candidate.gender,
    dateOfBirth: candidate.dateOfBirth,
    location: candidate.location,
    education: candidate.education,
    skills: candidate.skills,
    certifications: candidate.certifications,
    workExperience: candidate.workExperience,
    availability: candidate.availability,
    experienceLevel: candidate.experienceLevel,
    status: candidate.status,
    documents: candidate.documents,
    adminReview: candidate.adminReview,
  };
}

function isProfileComplete(candidate) {
  return Boolean(
    candidate.phoneNumber
    && candidate.gender
    && candidate.dateOfBirth
    && candidate.location
    && candidate.education
    && candidate.skills.length > 0
    && candidate.workExperience
    && candidate.availability
    && candidate.experienceLevel,
  );
}

async function getCandidateForUser(userId) {
  const candidate = await Candidate.findOne({ user: userId });

  if (!candidate) {
    throw new AppError('Candidate profile not found.', 404);
  }

  return candidate;
}

export const getMyProfile = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  response.status(200).json({ success: true, data: { candidate: serializeCandidate(candidate) } });
});

export const updateMyProfile = asyncHandler(async (request, response) => {
  const result = profileSchema.safeParse(request.body);

  if (!result.success) {
    throw new AppError('Invalid profile data.', 422);
  }

  const candidate = await getCandidateForUser(request.user.id);
  Object.assign(candidate, result.data);

  if (candidate.status === 'draft' && isProfileComplete(candidate)) {
    candidate.status = 'submitted';
  }

  await candidate.save();

  response.status(200).json({ success: true, data: { candidate: serializeCandidate(candidate) } });
});
