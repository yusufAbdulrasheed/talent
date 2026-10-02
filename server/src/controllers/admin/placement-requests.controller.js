import PlacementRequest from '../../models/placement-request.model.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { paginate } from '../../utils/pagination.js';
import { sendPlacementStatusEmail } from '../../services/notification.service.js';

const POPULATE = [
  { path: 'recruiterCompany', select: 'companyName companyEmail contactPerson user' },
  { path: 'candidate', select: 'referenceNumber status' },
];

function serialize(request) {
  const company = request.recruiterCompany;
  const candidate = request.candidate;

  return {
    id: request.id ?? request._id?.toString(),
    jobTitle: request.jobTitle,
    jobDescription: request.jobDescription,
    employmentType: request.employmentType,
    salaryRange: request.salaryRange,
    location: request.location,
    startDate: request.startDate,
    numberRequired: request.numberRequired,
    groupId: request.groupId ?? null,
    additionalNotes: request.additionalNotes,
    status: request.status,
    adminNote: request.adminNote,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    company: company
      ? {
        id: company._id?.toString(),
        companyName: company.companyName,
        companyEmail: company.companyEmail,
        contactPerson: company.contactPerson,
      }
      : null,
    candidate: candidate
      ? { id: candidate._id?.toString(), referenceNumber: candidate.referenceNumber, status: candidate.status }
      : null,
  };
}

export const listPlacementRequests = asyncHandler(async (request, response) => {
  const { status, page, limit } = request.validatedQuery;
  const query = status ? { status } : {};

  const { items, pagination } = await paginate(PlacementRequest, {
    query,
    page,
    limit,
    populate: POPULATE,
  });

  sendSuccess(response, {
    data: { placementRequests: items.map(serialize), pagination },
  });
});

export const getPlacementRequest = asyncHandler(async (request, response) => {
  const placementRequest = await PlacementRequest.findById(request.params.id).populate(POPULATE);

  if (!placementRequest) {
    throw new AppError('Placement request not found.', 404);
  }

  sendSuccess(response, { data: { placementRequest: serialize(placementRequest) } });
});

export const updatePlacementRequestStatus = asyncHandler(async (request, response) => {
  const placementRequest = await PlacementRequest.findById(request.params.id).populate(POPULATE);

  if (!placementRequest) {
    throw new AppError('Placement request not found.', 404);
  }

  placementRequest.status = request.validated.status;

  if (request.validated.adminNote !== undefined) {
    placementRequest.adminNote = request.validated.adminNote;
  }

  await placementRequest.save();

  // Best effort: the status change is saved, so a mail failure must not
  // surface to the administrator as a failed update.
  try {
    await sendPlacementStatusEmail(placementRequest, placementRequest.candidate?.referenceNumber);
  } catch (error) {
    console.error('Unable to notify the recruiter of a placement status change:', error);
  }

  sendSuccess(response, {
    message: 'Placement request updated.',
    data: { placementRequest: serialize(placementRequest) },
  });
});
