import { randomUUID } from 'node:crypto';
import Candidate from '../models/candidate.model.js';
import PlacementRequest from '../models/placement-request.model.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { getCompanyForUser } from '../services/recruiter.service.js';
import { getCurrentSubscription, getUnlockedExperienceLevels } from '../services/recruiter-subscription.service.js';
import { notifyAdminsOfPlacementRequest } from '../services/notification.service.js';

/**
 * A recruiter's view of their own request. The candidate is represented by
 * reference only — never by any identifying field.
 */
function serializePlacementRequest(request, candidateReference) {
  return {
    id: request.id,
    candidateReference: candidateReference ?? request.candidate?.referenceNumber ?? null,
    jobTitle: request.jobTitle,
    jobDescription: request.jobDescription,
    employmentType: request.employmentType,
    salaryRange: request.salaryRange,
    location: request.location,
    startDate: request.startDate,
    groupId: request.groupId ?? null,
    additionalNotes: request.additionalNotes,
    status: request.status,
    adminNote: request.adminNote,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

/**
 * Resolves references to approved candidates the recruiter's plan unlocks.
 * Resolving by reference and requiring APPROVED means a recruiter cannot reach
 * a candidate who is not in the talent pool; the tier check is the real guard
 * behind the client hiding locked talent. All-or-nothing: one bad reference
 * rejects the whole submission.
 */
async function resolveRequestableCandidates(company, references) {
  const normalised = references.map((reference) => reference.toUpperCase());
  const candidates = await Candidate.find({
    referenceNumber: { $in: normalised },
    status: CANDIDATE_STATUSES.APPROVED,
  }).select('_id referenceNumber experienceLevel');

  const byReference = new Map(candidates.map((candidate) => [candidate.referenceNumber, candidate]));
  const missing = normalised.filter((reference) => !byReference.has(reference));

  if (missing.length > 0) {
    throw new AppError(
      normalised.length === 1
        ? 'Candidate not found in the talent pool.'
        : `These talents are no longer in the talent pool: ${missing.join(', ')}.`,
      404,
    );
  }

  const subscription = await getCurrentSubscription(company.id);
  const unlockedLevels = getUnlockedExperienceLevels(subscription);
  const locked = normalised.filter((reference) => !unlockedLevels.includes(byReference.get(reference).experienceLevel));

  if (locked.length > 0) {
    throw new AppError(
      normalised.length === 1
        ? 'Subscribe to a higher tier to request this candidate.'
        : `Subscribe to a higher tier to request: ${locked.join(', ')}.`,
      403,
    );
  }

  return normalised.map((reference) => byReference.get(reference));
}

// Best effort: the requests are already saved, so a notification failure must
// not turn a successful submission into an error for the recruiter.
async function notifyAdmins(placementRequest, candidates, company) {
  try {
    await notifyAdminsOfPlacementRequest({
      request: {
        ...placementRequest.toObject(),
        id: placementRequest.id,
        candidateReference: candidates.map((candidate) => candidate.referenceNumber).join(', '),
        candidateCount: candidates.length,
      },
      companyName: company.companyName,
    });
  } catch (error) {
    console.error('Unable to notify administrators of a placement request:', error);
  }
}

export const createPlacementRequest = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  const { candidateReference, ...details } = request.validated;
  const [candidate] = await resolveRequestableCandidates(company, [candidateReference]);

  const placementRequest = await PlacementRequest.create({
    ...details,
    recruiterCompany: company.id,
    candidate: candidate.id,
  });

  await notifyAdmins(placementRequest, [candidate], company);

  sendSuccess(response, {
    status: 201,
    data: { placementRequest: serializePlacementRequest(placementRequest, candidate.referenceNumber) },
  });
});

/**
 * One role, several talents picked together from the talent pool. Stored as
 * one request per candidate (so the admin workflow is unchanged) sharing a
 * `groupId`, with a single notification to the administrators.
 */
export const createGroupPlacementRequest = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  const { candidateReferences, ...details } = request.validated;
  const candidates = await resolveRequestableCandidates(company, candidateReferences);
  const groupId = randomUUID();

  const placementRequests = await PlacementRequest.insertMany(
    candidates.map((candidate) => ({
      ...details,
      recruiterCompany: company.id,
      candidate: candidate._id,
      groupId,
    })),
  );

  await notifyAdmins(placementRequests[0], candidates, company);

  sendSuccess(response, {
    status: 201,
    data: {
      groupId,
      placementRequests: placementRequests.map((item, index) =>
        serializePlacementRequest(item, candidates[index].referenceNumber),
      ),
    },
  });
});

export const listMyPlacementRequests = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  const { status, page, limit } = request.validatedQuery;

  const query = { recruiterCompany: company.id };

  if (status) {
    query.status = status;
  }

  const [requests, total] = await Promise.all([
    PlacementRequest.find(query)
      .populate({ path: 'candidate', select: 'referenceNumber -_id' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PlacementRequest.countDocuments(query),
  ]);

  sendSuccess(response, {
    data: {
      placementRequests: requests.map((item) => serializePlacementRequest(item)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const getMyPlacementRequest = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);

  // Scoping the lookup by company means one recruiter can never read another's
  // request, even with a valid id.
  const placementRequest = await PlacementRequest.findOne({
    _id: request.params.id,
    recruiterCompany: company.id,
  }).populate({ path: 'candidate', select: 'referenceNumber -_id' });

  if (!placementRequest) {
    throw new AppError('Placement request not found.', 404);
  }

  sendSuccess(response, { data: { placementRequest: serializePlacementRequest(placementRequest) } });
});

export const getMyRequestSummary = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);

  const counts = await PlacementRequest.aggregate([
    { $match: { recruiterCompany: company._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const byStatus = Object.fromEntries(counts.map(({ _id, count }) => [_id, count]));
  const total = counts.reduce((sum, { count }) => sum + count, 0);

  sendSuccess(response, { data: { summary: { total, byStatus } } });
});
