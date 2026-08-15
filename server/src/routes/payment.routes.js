import { Router } from 'express';
import {
  getMyPayments,
  getPaymentStatus,
  initializeTrainingPayment,
} from '../controllers/payment.controller.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const paymentRouter = Router();

paymentRouter.use(authenticate, authorize(USER_ROLES.TALENT));
paymentRouter.post('/training/initialize', initializeTrainingPayment);
paymentRouter.get('/me', getMyPayments);
paymentRouter.get('/:reference/status', getPaymentStatus);

export default paymentRouter;
