import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import environment from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import talentRouter from './routes/talent.routes.js';
import recruiterRouter from './routes/recruiter.routes.js';
import paymentRouter from './routes/payment.routes.js';
import { paystackWebhook } from './controllers/payment.controller.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: environment.CLIENT_URL, credentials: true }));
app.use(morgan(environment.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.post('/api/v1/payments/paystack/webhook', express.raw({ type: 'application/json' }), paystackWebhook);
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/talent', talentRouter);
app.use('/api/v1/recruiter', recruiterRouter);
app.use('/api/v1/payments', paymentRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
