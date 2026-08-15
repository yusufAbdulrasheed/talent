import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  getCandidateForUser,
  isProfileComplete,
  serializeCandidate,
} from '../services/candidate.service.js';

export const getMyProfile = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  sendSuccess(response, { data: { candidate: serializeCandidate(candidate) } });
});

export const updateMyProfile = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  Object.assign(candidate, request.validated);

  // Completing the profile moves a draft forward on its own; later statuses
  // are only ever changed by payment confirmation or by an administrator.
  if (candidate.status === CANDIDATE_STATUSES.DRAFT && isProfileComplete(candidate)) {
    candidate.status = CANDIDATE_STATUSES.SUBMITTED;
  }

  await candidate.save();

  sendSuccess(response, { data: { candidate: serializeCandidate(candidate) } });
});
