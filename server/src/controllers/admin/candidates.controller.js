import Candidate from '../../models/candidate.model.js';
import Payment from '../../models/payment.model.js';
import { CANDIDATE_STATUSES } from '../../constants/statuses.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { escapeRegex, paginate } from '../../utils/pagination.js';
import { sendCandidateDecisionEmail } from '../../services/notification.service.js';

const REVIEWABLE_STATUSES = [
  CANDIDATE_STATUSES.SUBMITTED,
  CANDIDATE_STATUSES.UNDER_REVIEW,
  CANDIDATE_STATUSES.APPROVED,
  CANDIDATE_STATUSES.REJECTED,
];

function serializeForAdmin(candidate) {
  const user = candidate.user;

  return {
    id: candidate.id ?? candidate._id?.toString(),
    referenceNumber: candidate.referenceNumber,
    fullName: user ? `${user.firstName} ${user.lastName}` : null,
    email: user?.email ?? null,
    isEmailVerified: user?.isEmailVerified ?? null,
    phoneNumber: candidate.phoneNumber,
    gender: candidate.gender,
    dateOfBirth: candidate.dateOfBirth,
    location: candidate.location,
    jobTitle: candidate.jobTitle,
    education: candidate.education,
    skills: candidate.skills,
    certifications: candidate.certifications,
    bio: candidate.bio,
    workExperience: candidate.workExperience,
    availability: candidate.availability,
    experienceLevel: candidate.experienceLevel,
    documents: candidate.documents,
    status: candidate.status,
    adminReview: candidate.adminReview,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

export const listCandidates = asyncHandler(async (request, response) => {
  const { status, search, jobTitle, page, limit } = request.validatedQuery;
  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ referenceNumber: pattern }, { location: pattern }, { jobTitle: pattern }, { skills: pattern }];
  }

  if (jobTitle) {
    query.jobTitle = new RegExp(escapeRegex(jobTitle), 'i');
  }

  const { items, pagination } = await paginate(Candidate, {
    query,
    page,
    limit,
    populate: [{ path: 'user', select: 'firstName lastName email isEmailVerified' }],
  });

  sendSuccess(response, {
    data: { candidates: items.map(serializeForAdmin), pagination },
  });
});

export const getCandidate = asyncHandler(async (request, response) => {
  const candidate = await Candidate.findById(request.params.id).populate({
    path: 'user',
    select: 'firstName lastName email isEmailVerified isActive',
  });

  if (!candidate) {
    throw new AppError('Candidate not found.', 404);
  }

  const payments = await Payment.find({ candidate: candidate.id })
    .select('-providerPayload')
    .sort({ createdAt: -1 });

  sendSuccess(response, {
    data: { candidate: serializeForAdmin(candidate), payments },
  });
});

export const updateCandidateAttributes = asyncHandler(async (request, response) => {
  const candidate = await Candidate.findById(request.params.id).populate({
    path: 'user',
    select: 'firstName lastName email',
  });

  if (!candidate) {
    throw new AppError('Candidate not found.', 404);
  }

  Object.assign(candidate, request.validated);
  await candidate.save();

  sendSuccess(response, {
    message: 'Candidate attributes updated.',
    data: { candidate: serializeForAdmin(candidate) },
  });
});

export const updateCandidateStatus = asyncHandler(async (request, response) => {
  const { status, note } = request.validated;
  const candidate = await Candidate.findById(request.params.id).populate({
    path: 'user',
    select: 'firstName lastName email',
  });

  if (!candidate) {
    throw new AppError('Candidate not found.', 404);
  }

  if (!REVIEWABLE_STATUSES.includes(candidate.status)) {
    throw new AppError(
      'This candidate cannot be reviewed yet. Their profile or required documents are not yet complete.',
      409,
    );
  }

  candidate.status = status;
  candidate.adminReview = {
    reviewedBy: request.user.id,
    reviewedAt: new Date(),
    note: note ?? candidate.adminReview?.note,
  };

  await candidate.save();

  if (status === CANDIDATE_STATUSES.APPROVED || status === CANDIDATE_STATUSES.REJECTED) {
    try {
      await sendCandidateDecisionEmail(candidate, status, note);
    } catch (error) {
      console.error('Unable to send the candidate decision email:', error);
    }
  }

  sendSuccess(response, {
    message: 'Candidate status updated.',
    data: { candidate: serializeForAdmin(candidate) },
  });
});
