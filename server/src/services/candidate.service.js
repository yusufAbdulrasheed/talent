import Candidate from '../models/candidate.model.js';
import { AppError } from '../utils/app-error.js';

/** Fields a candidate must supply before their profile counts as complete. */
export function isProfileComplete(candidate) {
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
  };
}
