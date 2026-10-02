import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';
import { findAnonymousCandidate, searchTalentPool, summariseTiers } from '../services/talent-pool.service.js';
import { getCompanyForUser } from '../services/recruiter.service.js';
import { getCurrentSubscription, getUnlockedExperienceLevels } from '../services/recruiter-subscription.service.js';

async function resolveUnlockedLevels(userId) {
  const company = await getCompanyForUser(userId);
  const subscription = await getCurrentSubscription(company.id);
  return getUnlockedExperienceLevels(subscription);
}

export const searchCandidates = asyncHandler(async (request, response) => {
  const { page, limit, ...filters } = request.validatedQuery;
  const unlockedLevels = await resolveUnlockedLevels(request.user.id);
  const [result, tiers] = await Promise.all([
    searchTalentPool(filters, { page, limit }, unlockedLevels),
    summariseTiers(unlockedLevels),
  ]);

  sendSuccess(response, { data: { ...result, tiers } });
});

export const getCandidateByReference = asyncHandler(async (request, response) => {
  const unlockedLevels = await resolveUnlockedLevels(request.user.id);
  const candidate = await findAnonymousCandidate(request.params.reference, unlockedLevels);

  // Unapproved and non-existent candidates are indistinguishable here, so this
  // endpoint cannot be used to probe whether a reference exists.
  if (!candidate) {
    throw new AppError('Candidate not found in the talent pool.', 404);
  }

  sendSuccess(response, { data: { candidate } });
});
