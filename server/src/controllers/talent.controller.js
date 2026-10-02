import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  getCandidateForUser,
  hasRequiredDocuments,
  isProfileComplete,
  serializeCandidate,
} from '../services/candidate.service.js';

/**
 * A draft candidate advances to "submitted" on its own once the profile is
 * complete and every required document is uploaded; later statuses are only
 * ever changed by an administrator.
 */
function advanceDraftIfReady(candidate) {
  if (
    candidate.status === CANDIDATE_STATUSES.DRAFT
    && isProfileComplete(candidate)
    && hasRequiredDocuments(candidate)
  ) {
    candidate.status = CANDIDATE_STATUSES.SUBMITTED;
  }
}

export const getMyProfile = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  sendSuccess(response, { data: { candidate: serializeCandidate(candidate) } });
});

export const updateMyProfile = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  Object.assign(candidate, request.validated);

  advanceDraftIfReady(candidate);
  await candidate.save();

  sendSuccess(response, { data: { candidate: serializeCandidate(candidate) } });
});

/**
 * Replaces the candidate's document set. The client uploads each file to
 * Cloudinary via /uploads first, then sends the stored asset metadata here.
 */
export const putMyDocuments = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);

  candidate.documents = request.validated.documents.map((document) => ({
    ...document,
    uploadedAt: new Date(),
  }));

  advanceDraftIfReady(candidate);
  await candidate.save();

  sendSuccess(response, { data: { candidate: serializeCandidate(candidate) } });
});
