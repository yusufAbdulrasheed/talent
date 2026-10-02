import crypto from 'node:crypto';
import Payment, { PAYMENT_PURPOSES } from '../models/payment.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { getCompanyForUser } from '../services/recruiter.service.js';
import { initializePaystackTransaction } from '../services/paystack.service.js';
import {
  getCurrentSubscription,
  getTierPriceNgn,
  isDowngrade,
  serializeSubscription,
} from '../services/recruiter-subscription.service.js';

export const getMySubscription = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  const subscription = await getCurrentSubscription(company.id);

  sendSuccess(response, { data: { subscription: serializeSubscription(subscription) } });
});

export const initializeSubscriptionCheckout = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  const { tier } = request.validated;
  const subscription = await getCurrentSubscription(company.id);

  const priceNgn = getTierPriceNgn(tier);
  if (!priceNgn) {
    throw new AppError('This tier is not currently available for purchase.', 503);
  }

  if (isDowngrade(subscription, tier)) {
    throw new AppError('You already have a higher tier active.', 409);
  }

  const reference = `SUB-${crypto.randomUUID()}`;
  const amount = priceNgn * 100; // kobo

  await Payment.create({
    purpose: PAYMENT_PURPOSES.RECRUITER_SUBSCRIPTION,
    recruiterCompany: company.id,
    subscriptionTier: tier,
    provider: 'paystack',
    reference,
    amount,
    status: 'initialized',
  });

  const { authorization_url: authorizationUrl } = await initializePaystackTransaction({
    email: company.companyEmail,
    amountInKobo: amount,
    reference,
    metadata: { purpose: PAYMENT_PURPOSES.RECRUITER_SUBSCRIPTION, recruiterCompanyId: company.id, tier },
  });

  sendSuccess(response, { status: 201, data: { authorizationUrl, reference } });
});

export const getSubscriptionCheckoutStatus = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  const payment = await Payment.findOne({
    reference: request.params.reference,
    purpose: PAYMENT_PURPOSES.RECRUITER_SUBSCRIPTION,
    recruiterCompany: company.id,
  });

  if (!payment) {
    throw new AppError('Payment not found.', 404);
  }

  const subscription = await getCurrentSubscription(company.id);

  sendSuccess(response, {
    data: {
      payment: {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
      },
      subscription: serializeSubscription(subscription),
    },
  });
});
