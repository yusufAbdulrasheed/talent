import { Router } from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/talent.controller.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { talentProfileSchema } from '../validators/talent.validators.js';

const talentRouter = Router();

talentRouter.use(authenticate, authorize(USER_ROLES.TALENT));
talentRouter.get('/profile', getMyProfile);
talentRouter.patch('/profile', validateBody(talentProfileSchema), updateMyProfile);

export default talentRouter;
