import Candidate, { REQUIRED_DOCUMENT_TYPES } from '../models/candidate.model.js';
import { AppError } from '../utils/app-error.js';

/**
 * Fields a candidate must supply before their profile counts as complete.
 * `availability` and `experienceLevel` are set by an administrator, not the
 * candidate, so they are not part of this check.
 */
export function isProfileComplete(candidate) {
  return Boolean(
    candidate.phoneNumber
    && candidate.gender
    && candidate.dateOfBirth
    && candidate.location
    && candidate.education
    && candidate.skills.length > 0
    && candidate.workExperience,
  );
}

/** True once every required document type has been uploaded. */
export function hasRequiredDocuments(candidate) {
  const uploaded = new Set((candidate.documents ?? []).map((document) => document.type));
  return REQUIRED_DOCUMENT_TYPES.every((type) => uploaded.has(type));
}

export async function getCandidateForUser(userId) {
  const candidate = await Candidate.findOne({ user: userId });

  if (!candidate) {
    throw new AppError('Candidate profile not found.', 404);
  }

  return candidate;
}

/** The candidate's own view of their record. Never used for the talent pool. */
export function serializeCandidate(candidate) {
  return {
    id: candidate.id,
    referenceNumber: candidate.referenceNumber,
    phoneNumber: candidate.phoneNumber,
    gender: candidate.gender,
    dateOfBirth: candidate.dateOfBirth,
    location: candidate.location,
    jobTitle: candidate.jobTitle,
    bio: candidate.bio,
    education: candidate.education,
    skills: candidate.skills,
    certifications: candidate.certifications,
    workExperience: candidate.workExperience,
    availability: candidate.availability,
    experienceLevel: candidate.experienceLevel,
    status: candidate.status,
    documents: candidate.documents,
    adminReview: candidate.adminReview,
    isProfileComplete: isProfileComplete(candidate),
    hasRequiredDocuments: hasRequiredDocuments(candidate),
  };
}
