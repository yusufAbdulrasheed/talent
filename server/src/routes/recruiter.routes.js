import { Router } from 'express';
import { getMyCompany, updateMyCompany } from '../controllers/recruiter.controller.js';
import { getCandidateByReference, searchCandidates } from '../controllers/talent-pool.controller.js';
import {
  createGroupPlacementRequest,
  createPlacementRequest,
  getMyPlacementRequest,
  getMyRequestSummary,
  listMyPlacementRequests,
} from '../controllers/placement-request.controller.js';
import {
  getMySubscription,
  getSubscriptionCheckoutStatus,
  initializeSubscriptionCheckout,
} from '../controllers/recruiter-subscription.controller.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  companyProfileSchema,
  groupPlacementRequestSchema,
  placementRequestQuerySchema,
  placementRequestSchema,
  subscriptionCheckoutSchema,
  talentPoolQuerySchema,
} from '../validators/recruiter.validators.js';

const recruiterRouter = Router();

// Every route below is recruiter-only. Junior-tier talent (entry/junior
// candidates) is free to browse and request; intermediate/senior candidates
// require an active paid subscription — see recruiter-subscription.service.js.
recruiterRouter.use(authenticate, authorize(USER_ROLES.RECRUITER));

recruiterRouter.get('/company', getMyCompany);
recruiterRouter.patch('/company', validateBody(companyProfileSchema), updateMyCompany);

recruiterRouter.get('/talent-pool', validateQuery(talentPoolQuerySchema), searchCandidates);
recruiterRouter.get('/talent-pool/:reference', getCandidateByReference);

recruiterRouter.get('/subscription', getMySubscription);
recruiterRouter.post('/subscription/checkout', validateBody(subscriptionCheckoutSchema), initializeSubscriptionCheckout);
recruiterRouter.get('/subscription/checkout/:reference/status', getSubscriptionCheckoutStatus);

recruiterRouter.get('/placement-requests/summary', getMyRequestSummary);
recruiterRouter.get('/placement-requests', validateQuery(placementRequestQuerySchema), listMyPlacementRequests);
recruiterRouter.post('/placement-requests', validateBody(placementRequestSchema), createPlacementRequest);
recruiterRouter.post(
  '/placement-requests/group',
  validateBody(groupPlacementRequestSchema),
  createGroupPlacementRequest,
);
recruiterRouter.get('/placement-requests/:id', getMyPlacementRequest);

export default recruiterRouter;
