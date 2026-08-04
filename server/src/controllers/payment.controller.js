import crypto from 'node:crypto';
import Candidate from '../models/candidate.model.js';
import Payment from '../models/payment.model.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  getTrainingFeeInKobo,
  initializePaystackTransaction,
  verifyPaystackSignature,
  verifyPaystackTransaction,
} from '../services/paystack.service.js';

async function getCandidateForUser(userId) {
  const candidate = await Candidate.findOne({ user: userId });

  if (!candidate) {
    throw new AppError('Candidate profile not found.', 404);
  }

  return candidate;
}

export const initializeTrainingPayment = asyncHandler(async (request, response) => {
  if (!request.user.isEmailVerified) {
    throw new AppError('Verify your email address before making payment.', 403);
  }

  const candidate = await getCandidateForUser(request.user.id);

  const missingProfileFields = [
    candidate.phoneNumber,
    candidate.gender,
    candidate.dateOfBirth,
    candidate.location,
    candidate.education,
    candidate.skills.length > 0,
    candidate.workExperience,
    candidate.availability,
    candidate.experienceLevel,
  ].some((value) => !value);

  if (missingProfileFields) {
    throw new AppError('Complete your profile before making payment.', 422);
  }

  if ([CANDIDATE_STATUSES.PAYMENT_CONFIRMED, CANDIDATE_STATUSES.UNDER_REVIEW, CANDIDATE_STATUSES.APPROVED].includes(candidate.status)) {
    throw new AppError('Your training payment has already been confirmed.', 409);
  }

  const amountInKobo = getTrainingFeeInKobo();
  const reference = `TMS-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const payment = await Payment.create({
    candidate: candidate.id,
    reference,
    amount: amountInKobo / 100,
    status: 'initialized',
  });

  const transaction = await initializePaystackTransaction({
    email: request.user.email,
    amountInKobo,
    reference,
    metadata: { candidateReference: candidate.referenceNumber, paymentId: payment.id },
  });

  candidate.status = CANDIDATE_STATUSES.PAYMENT_PENDING;
  await candidate.save();

  response.status(201).json({
    success: true,
    data: { authorizationUrl: transaction.authorization_url, reference: payment.reference },
  });
});

export const getMyPayments = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  const payments = await Payment.find({ candidate: candidate.id }).sort({ createdAt: -1 });
  response.status(200).json({ success: true, data: { payments } });
});

export const paystackWebhook = asyncHandler(async (request, response) => {
  const signature = request.headers['x-paystack-signature'];

  if (typeof signature !== 'string' || !verifyPaystackSignature(request.body, signature)) {
    throw new AppError('Invalid Paystack webhook signature.', 401);
  }

  const event = JSON.parse(request.body.toString('utf8'));

  if (event.event !== 'charge.success') {
    response.status(200).json({ success: true });
    return;
  }

  const reference = event.data?.reference;
  const payment = await Payment.findOne({ reference }).populate('candidate');

  if (!payment) {
    response.status(200).json({ success: true });
    return;
  }

  if (!payment.candidate) {
    throw new AppError('Candidate profile not found for this payment.', 404);
  }

  const verifiedTransaction = await verifyPaystackTransaction(reference);
  const expectedAmountInKobo = Math.round(payment.amount * 100);

  if (verifiedTransaction.status !== 'success' || verifiedTransaction.amount !== expectedAmountInKobo || verifiedTransaction.currency !== payment.currency) {
    throw new AppError('Paystack transaction verification failed.', 400);
  }

  if (payment.status !== 'success') {
    payment.status = 'success';
    payment.paidAt = new Date(verifiedTransaction.paid_at);
    payment.providerPayload = verifiedTransaction;
    await payment.save();

    payment.candidate.status = CANDIDATE_STATUSES.PAYMENT_CONFIRMED;
    await payment.candidate.save();
  }

  response.status(200).json({ success: true });
});
