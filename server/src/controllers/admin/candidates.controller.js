import Candidate from '../../models/candidate.model.js';
import Payment from '../../models/payment.model.js';
import { CANDIDATE_STATUSES } from '../../constants/statuses.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { escapeRegex, paginate } from '../../utils/pagination.js';
import { sendCandidateDecisionEmail } from '../../services/notification.service.js';

// A candidate is only reviewable once their payment has been confirmed.
const REVIEWABLE_STATUSES = [
  CANDIDATE_STATUSES.PAYMENT_CONFIRMED,
  CANDIDATE_STATUSES.UNDER_REVIEW,
  CANDIDATE_STATUSES.APPROVED,
  CANDIDATE_STATUSES.REJECTED,
];

/**
 * Administrators see identifying data — that is the point of the review
 * screen. This is the one serializer that may expose it.
 */
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
    education: candidate.education,
    skills: candidate.skills,
    certifications: candidate.certifications,
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
  const { status, search, page, limit } = request.validatedQuery;
  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ referenceNumber: pattern }, { location: pattern }, { skills: pattern }];
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

export const updateCandidateStatus = asyncHandler(async (request, response) => {
  const { status, note } = request.validated;
  const candidate = await Candidate.findById(request.params.id).populate({
    path: 'user',
    select: 'firstName lastName email',
  });

  if (!candidate) {
    throw new AppError('Candidate not found.', 404);
  }

  // Approving someone who has not paid would put them in the talent pool
  // without completing onboarding.
  if (!REVIEWABLE_STATUSES.includes(candidate.status)) {
    throw new AppError(
      'This candidate cannot be reviewed yet. Their training payment has not been confirmed.',
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

  // Best effort: the decision is already recorded, so a mail failure must not
  // surface as a failed status change.
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
