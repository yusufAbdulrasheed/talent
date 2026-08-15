import { Router } from 'express';
import { getMyDashboard } from '../controllers/trainer.controller.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const trainerRouter = Router();

// Read-only by design: this router exposes no mutating verbs at all.
trainerRouter.use(authenticate, authorize(USER_ROLES.TRAINER));
trainerRouter.get('/dashboard', getMyDashboard);

export default trainerRouter;
