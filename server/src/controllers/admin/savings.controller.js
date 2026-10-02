import Candidate from '../../models/candidate.model.js';
import TalentSavings, { WITHDRAWAL_STATUSES } from '../../models/talent-savings.model.js';
import { CANDIDATE_STATUSES } from '../../constants/statuses.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import {
  configureSavings,
  decideWithdrawal as decideWithdrawalService,
  getOrCreateSavings,
  serializeSavings,
} from '../../services/talent-savings.service.js';
import { notifyTalentOfWithdrawalDecision } from '../../services/notification.service.js';

async function requireApprovedCandidate(candidateId) {
  const candidate = await Candidate.findById(candidateId);

  if (!candidate) {
    throw new AppError('Candidate not found.', 404);
  }
  if (candidate.status !== CANDIDATE_STATUSES.APPROVED) {
    throw new AppError('Only approved candidates can have a savings account.', 409);
  }

  return candidate;
}

export const getCandidateSavings = asyncHandler(async (request, response) => {
  await requireApprovedCandidate(request.params.id);
  const savings = await getOrCreateSavings(request.params.id);

  sendSuccess(response, { data: { savings: serializeSavings(savings) } });
});

export const configureCandidateSavings = asyncHandler(async (request, response) => {
  await requireApprovedCandidate(request.params.id);
  const savings = await configureSavings(request.params.id, request.validated);

  sendSuccess(response, { message: 'Savings configured.', data: { savings: serializeSavings(savings) } });
});

export const listWithdrawalRequests = asyncHandler(async (request, response) => {
  const { status = WITHDRAWAL_STATUSES.PENDING, page, limit } = request.validatedQuery;

  const pipeline = [
    { $unwind: '$withdrawalRequests' },
    { $match: { 'withdrawalRequests.status': status } },
    { $sort: { 'withdrawalRequests.requestedAt': -1 } },
  ];

  const [rows, totalRows] = await Promise.all([
    TalentSavings.aggregate([
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $lookup: { from: 'candidates', localField: 'candidate', foreignField: '_id', as: 'candidate' } },
      { $unwind: '$candidate' },
      { $lookup: { from: 'users', localField: 'candidate.user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
    ]),
    TalentSavings.aggregate([...pipeline, { $count: 'count' }]),
  ]);

  const total = totalRows[0]?.count ?? 0;

  sendSuccess(response, {
    data: {
      withdrawalRequests: rows.map((row) => ({
        id: row.withdrawalRequests._id,
        candidateId: row.candidate._id,
        referenceNumber: row.candidate.referenceNumber,
        fullName: `${row.user.firstName} ${row.user.lastName}`,
        amount: row.withdrawalRequests.amount,
        balanceAtRequest: row.withdrawalRequests.balanceAtRequest,
        status: row.withdrawalRequests.status,
        requestedAt: row.withdrawalRequests.requestedAt,
        decidedAt: row.withdrawalRequests.decidedAt,
        decisionNote: row.withdrawalRequests.decisionNote,
      })),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const decideWithdrawal = asyncHandler(async (request, response) => {
  const { candidateId, requestId } = request.params;
  const candidate = await Candidate.findById(candidateId).populate({ path: 'user', select: 'firstName lastName email' });

  if (!candidate) {
    throw new AppError('Candidate not found.', 404);
  }

  const savings = await decideWithdrawalService(candidateId, requestId, request.validated, request.user.id);

  try {
    const withdrawalRequest = savings.withdrawalRequests.id(requestId);
    await notifyTalentOfWithdrawalDecision(candidate, withdrawalRequest);
  } catch (error) {
    console.error('Unable to notify the candidate of a withdrawal decision:', error);
  }

  sendSuccess(response, { message: 'Withdrawal request updated.', data: { savings: serializeSavings(savings) } });
});
