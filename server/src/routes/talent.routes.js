import { Router } from 'express';
import { getMyProfile, putMyDocuments, updateMyProfile } from '../controllers/talent.controller.js';
import { getMySavings, requestWithdrawal, setParticipation } from '../controllers/talent-savings.controller.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  savingsParticipationSchema,
  savingsWithdrawalRequestSchema,
  talentDocumentsSchema,
  talentProfileSchema,
} from '../validators/talent.validators.js';

const talentRouter = Router();

talentRouter.use(authenticate, authorize(USER_ROLES.TALENT));
talentRouter.get('/profile', getMyProfile);
talentRouter.patch('/profile', validateBody(talentProfileSchema), updateMyProfile);
talentRouter.put('/documents', validateBody(talentDocumentsSchema), putMyDocuments);

talentRouter.get('/savings', getMySavings);
talentRouter.post('/savings/withdrawals', validateBody(savingsWithdrawalRequestSchema), requestWithdrawal);
talentRouter.patch('/savings/participation', validateBody(savingsParticipationSchema), setParticipation);

export default talentRouter;
