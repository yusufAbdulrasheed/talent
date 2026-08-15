import crypto from 'node:crypto';
import Payment from '../models/payment.model.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { getCandidateForUser, isProfileComplete } from '../services/candidate.service.js';
import { sendPaymentReceiptEmail } from '../services/notification.service.js';
import {
  getTrainingFeeInKobo,
  initializePaystackTransaction,
  verifyPaystackSignature,
  verifyPaystackTransaction,
} from '../services/paystack.service.js';

const PAID_STATUSES = [
  CANDIDATE_STATUSES.PAYMENT_CONFIRMED,
  CANDIDATE_STATUSES.UNDER_REVIEW,
  CANDIDATE_STATUSES.APPROVED,
];

export const initializeTrainingPayment = asyncHandler(async (request, response) => {
  if (!request.user.isEmailVerified) {
    throw new AppError('Verify your email address before making payment.', 403);
  }

  const candidate = await getCandidateForUser(request.user.id);

  if (!isProfileComplete(candidate)) {
    throw new AppError('Complete your profile before making payment.', 422);
  }

  if (PAID_STATUSES.includes(candidate.status)) {
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

  sendSuccess(response, {
    status: 201,
    data: { authorizationUrl: transaction.authorization_url, reference: payment.reference },
  });
});

export const getMyPayments = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  const payments = await Payment.find({ candidate: candidate.id })
    .select('-providerPayload')
    .sort({ createdAt: -1 });

  sendSuccess(response, { data: { payments } });
});

/**
 * Lets the Paystack return page show an accurate result without trusting the
 * redirect: the status reported here is whatever the webhook already verified
 * and stored.
 */
export const getPaymentStatus = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  const payment = await Payment.findOne({
    reference: request.params.reference,
    candidate: candidate.id,
  }).select('-providerPayload');

  if (!payment) {
    throw new AppError('Payment not found.', 404);
  }

  sendSuccess(response, {
    data: {
      payment: {
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt,
      },
      candidateStatus: candidate.status,
    },
  });
});

export const paystackWebhook = asyncHandler(async (request, response) => {
  const signature = request.headers['x-paystack-signature'];

  if (typeof signature !== 'string' || !verifyPaystackSignature(request.body, signature)) {
    throw new AppError('Invalid Paystack webhook signature.', 401);
  }

  const event = JSON.parse(request.body.toString('utf8'));

  if (event.event !== 'charge.success') {
    sendSuccess(response);
    return;
  }

  const reference = event.data?.reference;
  const payment = await Payment.findOne({ reference }).populate({
    path: 'candidate',
    populate: { path: 'user', select: 'email firstName' },
  });

  // Unknown references are acknowledged rather than retried: they are not ours.
  if (!payment) {
    sendSuccess(response);
    return;
  }

  if (!payment.candidate) {
    throw new AppError('Candidate profile not found for this payment.', 404);
  }

  // The webhook payload is only a trigger. The amount, currency, and status are
  // read back from Paystack directly before anything is trusted.
  const verifiedTransaction = await verifyPaystackTransaction(reference);
  const expectedAmountInKobo = Math.round(payment.amount * 100);

  if (
    verifiedTransaction.status !== 'success'
    || verifiedTransaction.amount !== expectedAmountInKobo
    || verifiedTransaction.currency !== payment.currency
  ) {
    throw new AppError('Paystack transaction verification failed.', 400);
  }

  // Paystack retries webhooks, so this must stay idempotent.
  if (payment.status !== 'success') {
    payment.status = 'success';
    payment.paidAt = new Date(verifiedTransaction.paid_at);
    payment.providerPayload = verifiedTransaction;
    await payment.save();

    payment.candidate.status = CANDIDATE_STATUSES.PAYMENT_CONFIRMED;
    await payment.candidate.save();

    // A failed receipt must not fail the webhook, or Paystack would retry a
    // payment that has already been recorded.
    try {
      await sendPaymentReceiptEmail(payment);
    } catch (error) {
      console.error('Unable to send payment receipt:', error);
    }
  }

  sendSuccess(response);
});
