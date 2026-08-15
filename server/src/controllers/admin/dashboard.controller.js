import Candidate from '../../models/candidate.model.js';
import RecruiterCompany from '../../models/recruiter-company.model.js';
import PlacementRequest from '../../models/placement-request.model.js';
import Payment from '../../models/payment.model.js';
import User from '../../models/user.model.js';
import Program from '../../models/program.model.js';
import { CANDIDATE_STATUSES, PLACEMENT_REQUEST_STATUSES } from '../../constants/statuses.js';
import { USER_ROLES } from '../../constants/user-roles.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';

const PAID_STATUSES = [
  CANDIDATE_STATUSES.PAYMENT_CONFIRMED,
  CANDIDATE_STATUSES.UNDER_REVIEW,
  CANDIDATE_STATUSES.APPROVED,
];

/** Operational counts for the admin landing page. */
export const getDashboard = asyncHandler(async (_request, response) => {
  const [
    candidatesByStatus,
    totalCandidates,
    paidCandidates,
    recruiters,
    approvedRecruiters,
    requestsByStatus,
    totalRequests,
    trainers,
    programs,
    revenue,
  ] = await Promise.all([
    Candidate.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Candidate.countDocuments(),
    Candidate.countDocuments({ status: { $in: PAID_STATUSES } }),
    RecruiterCompany.countDocuments(),
    RecruiterCompany.countDocuments({ isApproved: true }),
    PlacementRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    PlacementRequest.countDocuments(),
    User.countDocuments({ role: USER_ROLES.TRAINER, isActive: true }),
    Program.countDocuments({ isActive: true }),
    Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const toMap = (rows) => Object.fromEntries(rows.map(({ _id, count }) => [_id, count]));
  const candidateCounts = toMap(candidatesByStatus);

  sendSuccess(response, {
    data: {
      candidates: {
        total: totalCandidates,
        paid: paidCandidates,
        approved: candidateCounts[CANDIDATE_STATUSES.APPROVED] ?? 0,
        awaitingReview:
          (candidateCounts[CANDIDATE_STATUSES.PAYMENT_CONFIRMED] ?? 0)
          + (candidateCounts[CANDIDATE_STATUSES.UNDER_REVIEW] ?? 0),
        byStatus: candidateCounts,
      },
      recruiters: { total: recruiters, approved: approvedRecruiters },
      placementRequests: {
        total: totalRequests,
        open:
          (toMap(requestsByStatus)[PLACEMENT_REQUEST_STATUSES.SUBMITTED] ?? 0)
          + (toMap(requestsByStatus)[PLACEMENT_REQUEST_STATUSES.UNDER_REVIEW] ?? 0)
          + (toMap(requestsByStatus)[PLACEMENT_REQUEST_STATUSES.IN_PROGRESS] ?? 0),
        byStatus: toMap(requestsByStatus),
      },
      trainers: { active: trainers },
      programs: { active: programs },
      payments: {
        successfulCount: revenue[0]?.count ?? 0,
        totalAmount: revenue[0]?.total ?? 0,
      },
    },
  });
});
