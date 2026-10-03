import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { verifyPaystackSignature, verifyPaystackTransaction } from '../services/paystack.service.js';
import Payment, { PAYMENT_PURPOSES } from '../models/payment.model.js';
import RecruiterCompany from '../models/recruiter-company.model.js';
import { activateTier, applyLazyExpiry, getOrCreateSubscription } from '../services/recruiter-subscription.service.js';
import { notifyUser } from '../services/notification.service.js';

async function handleChargeSuccess(reference) {
  const payment = await Payment.findOne({ reference });

  if (!payment || payment.status === 'success') {
    return;
  }

  const verified = await verifyPaystackTransaction(reference);
  if (verified.status !== 'success') {
    return;
  }

  payment.status = 'success';
  payment.paidAt = verified.paid_at ? new Date(verified.paid_at) : new Date();
  payment.providerPayload = verified;
  await payment.save();

  if (payment.purpose !== PAYMENT_PURPOSES.RECRUITER_SUBSCRIPTION) {
    return;
  }

  const subscription = await getOrCreateSubscription(payment.recruiterCompany);
  applyLazyExpiry(subscription);
  activateTier(subscription, payment.subscriptionTier);
  await subscription.save();

  try {
    const company = await RecruiterCompany.findById(payment.recruiterCompany);
    if (company) {
      await notifyUser({
        recipient: company.user,
        type: 'subscription.activated',
        title: 'Subscription activated',
        message: `Your ${payment.subscriptionTier} tier is now active.`,
      });
    }
  } catch (error) {
    console.error('Unable to notify the recruiter of their subscription activation:', error);
  }
}

export const paystackWebhook = asyncHandler(async (request, response) => {
  const signature = request.headers['x-paystack-signature'];

  if (typeof signature !== 'string' || !verifyPaystackSignature(request.body, signature)) {
    throw new AppError('Invalid Paystack webhook signature.', 401);
  }

  const event = JSON.parse(request.body.toString('utf8'));

  if (event.event === 'charge.success') {
    await handleChargeSuccess(event.data.reference);
  }

  sendSuccess(response);
});
