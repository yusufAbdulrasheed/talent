import { Router } from 'express';
import { getMyCompany, updateMyCompany } from '../controllers/recruiter.controller.js';
import { getCandidateByReference, searchCandidates } from '../controllers/talent-pool.controller.js';
import {
  createPlacementRequest,
  getMyPlacementRequest,
  getMyRequestSummary,
  listMyPlacementRequests,
} from '../controllers/placement-request.controller.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  companyProfileSchema,
  placementRequestQuerySchema,
  placementRequestSchema,
  talentPoolQuerySchema,
} from '../validators/recruiter.validators.js';

const recruiterRouter = Router();

// Every route below is recruiter-only. No MVP billing gate: recruiters can
// search and submit requests without a subscription.
recruiterRouter.use(authenticate, authorize(USER_ROLES.RECRUITER));

recruiterRouter.get('/company', getMyCompany);
recruiterRouter.patch('/company', validateBody(companyProfileSchema), updateMyCompany);

recruiterRouter.get('/talent-pool', validateQuery(talentPoolQuerySchema), searchCandidates);
recruiterRouter.get('/talent-pool/:reference', getCandidateByReference);

recruiterRouter.get('/placement-requests/summary', getMyRequestSummary);
recruiterRouter.get('/placement-requests', validateQuery(placementRequestQuerySchema), listMyPlacementRequests);
recruiterRouter.post('/placement-requests', validateBody(placementRequestSchema), createPlacementRequest);
recruiterRouter.get('/placement-requests/:id', getMyPlacementRequest);

export default recruiterRouter;
