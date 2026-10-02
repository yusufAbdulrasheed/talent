import { Router } from 'express';
import { z } from 'zod';
import { getDashboard } from '../controllers/admin/dashboard.controller.js';
import {
  getCandidate,
  listCandidates,
  updateCandidateAttributes,
  updateCandidateStatus,
} from '../controllers/admin/candidates.controller.js';
import {
  configureCandidateSavings,
  decideWithdrawal,
  getCandidateSavings,
  listWithdrawalRequests,
} from '../controllers/admin/savings.controller.js';
import {
  getRecruiter,
  listRecruiters,
  setRecruiterApproval,
} from '../controllers/admin/recruiters.controller.js';
import {
  createTrainer,
  listTrainers,
  setTrainerStatus,
} from '../controllers/admin/trainers.controller.js';
import {
  createAssignment,
  createProgram,
  listAssignments,
  listPrograms,
  updateAssignment,
  updateProgram,
} from '../controllers/admin/programs.controller.js';
import { getPayment, listPayments } from '../controllers/admin/payments.controller.js';
import {
  getPlacementRequest,
  listPlacementRequests,
  updatePlacementRequestStatus,
} from '../controllers/admin/placement-requests.controller.js';
import {
  createContent,
  deleteContent,
  listContent,
  updateContent,
} from '../controllers/admin/content.controller.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  assignmentSchema,
  assignmentUpdateSchema,
  candidateAttributesSchema,
  candidateListQuerySchema,
  candidateStatusSchema,
  contentListQuerySchema,
  contentSchema,
  contentUpdateSchema,
  createTrainerSchema,
  paymentListQuerySchema,
  placementListQuerySchema,
  placementStatusSchema,
  programSchema,
  programUpdateSchema,
  recruiterApprovalSchema,
  recruiterListQuerySchema,
  savingsConfigSchema,
  savingsWithdrawalDecisionSchema,
  savingsWithdrawalListQuerySchema,
  trainerStatusSchema,
} from '../validators/admin.validators.js';

const adminRouter = Router();

const paginationOnlySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

adminRouter.use(authenticate, authorize(USER_ROLES.ADMIN));

adminRouter.get('/dashboard', getDashboard);

adminRouter.get('/candidates', validateQuery(candidateListQuerySchema), listCandidates);
adminRouter.get('/candidates/:id', getCandidate);
adminRouter.patch('/candidates/:id/status', validateBody(candidateStatusSchema), updateCandidateStatus);
adminRouter.patch('/candidates/:id/attributes', validateBody(candidateAttributesSchema), updateCandidateAttributes);

adminRouter.get('/candidates/:id/savings', getCandidateSavings);
adminRouter.patch('/candidates/:id/savings/config', validateBody(savingsConfigSchema), configureCandidateSavings);
adminRouter.get('/savings/withdrawals', validateQuery(savingsWithdrawalListQuerySchema), listWithdrawalRequests);
adminRouter.patch(
  '/savings/withdrawals/:candidateId/:requestId',
  validateBody(savingsWithdrawalDecisionSchema),
  decideWithdrawal,
);

adminRouter.get('/recruiters', validateQuery(recruiterListQuerySchema), listRecruiters);
adminRouter.get('/recruiters/:id', getRecruiter);
adminRouter.patch('/recruiters/:id/approval', validateBody(recruiterApprovalSchema), setRecruiterApproval);

adminRouter.get('/trainers', validateQuery(paginationOnlySchema), listTrainers);
adminRouter.post('/trainers', validateBody(createTrainerSchema), createTrainer);
adminRouter.patch('/trainers/:id/status', validateBody(trainerStatusSchema), setTrainerStatus);

adminRouter.get('/programs', validateQuery(paginationOnlySchema), listPrograms);
adminRouter.post('/programs', validateBody(programSchema), createProgram);
adminRouter.patch('/programs/:id', validateBody(programUpdateSchema), updateProgram);

adminRouter.get('/assignments', validateQuery(paginationOnlySchema), listAssignments);
adminRouter.post('/assignments', validateBody(assignmentSchema), createAssignment);
adminRouter.patch('/assignments/:id', validateBody(assignmentUpdateSchema), updateAssignment);

adminRouter.get('/payments', validateQuery(paymentListQuerySchema), listPayments);
adminRouter.get('/payments/:id', getPayment);

adminRouter.get('/placement-requests', validateQuery(placementListQuerySchema), listPlacementRequests);
adminRouter.get('/placement-requests/:id', getPlacementRequest);
adminRouter.patch('/placement-requests/:id/status', validateBody(placementStatusSchema), updatePlacementRequestStatus);

adminRouter.get('/content', validateQuery(contentListQuerySchema), listContent);
adminRouter.post('/content', validateBody(contentSchema), createContent);
adminRouter.patch('/content/:id', validateBody(contentUpdateSchema), updateContent);
adminRouter.delete('/content/:id', deleteContent);

export default adminRouter;
