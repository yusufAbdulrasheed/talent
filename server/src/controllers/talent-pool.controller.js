import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';
import { findAnonymousCandidate, searchTalentPool } from '../services/talent-pool.service.js';

export const searchCandidates = asyncHandler(async (request, response) => {
  const { page, limit, ...filters } = request.validatedQuery;
  const result = await searchTalentPool(filters, { page, limit });

  sendSuccess(response, { data: result });
});

export const getCandidateByReference = asyncHandler(async (request, response) => {
  const candidate = await findAnonymousCandidate(request.params.reference);

  // Unapproved and non-existent candidates are indistinguishable here, so this
  // endpoint cannot be used to probe whether a reference exists.
  if (!candidate) {
    throw new AppError('Candidate not found in the talent pool.', 404);
  }

  sendSuccess(response, { data: { candidate } });
});
