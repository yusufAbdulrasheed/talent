import Candidate from '../models/candidate.model.js';
import PlacementRequest from '../models/placement-request.model.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { getCompanyForUser } from '../services/recruiter.service.js';
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
    numberRequired: request.numberRequired,
    additionalNotes: request.additionalNotes,
    status: request.status,
    adminNote: request.adminNote,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export const createPlacementRequest = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  const { candidateReference, ...details } = request.validated;

  // Resolving by reference and requiring APPROVED means a recruiter cannot
  // reach a candidate who is not in the talent pool.
  const candidate = await Candidate.findOne({
    referenceNumber: candidateReference.toUpperCase(),
    status: CANDIDATE_STATUSES.APPROVED,
  }).select('_id referenceNumber');

  if (!candidate) {
    throw new AppError('Candidate not found in the talent pool.', 404);
  }

  const placementRequest = await PlacementRequest.create({
    ...details,
    recruiterCompany: company.id,
    candidate: candidate.id,
  });

  // Best effort: the request is already saved, so a notification failure must
  // not turn a successful submission into an error for the recruiter.
  try {
    await notifyAdminsOfPlacementRequest({
      request: { ...placementRequest.toObject(), id: placementRequest.id, candidateReference: candidate.referenceNumber },
      companyName: company.companyName,
    });
  } catch (error) {
    console.error('Unable to notify administrators of a placement request:', error);
  }

  sendSuccess(response, {
    status: 201,
    data: { placementRequest: serializePlacementRequest(placementRequest, candidate.referenceNumber) },
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
