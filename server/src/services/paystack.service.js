import crypto from 'node:crypto';
import environment from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const PAYSTACK_API_URL = 'https://api.paystack.co';

function getPaystackSecret() {
  if (!environment.PAYSTACK_SECRET_KEY) {
    throw new AppError('Paystack is not configured.', 503);
  }

  return environment.PAYSTACK_SECRET_KEY;
}

async function paystackRequest(path, options = {}) {
  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const payload = await response.json();

  if (!response.ok || !payload.status) {
    throw new AppError(payload.message || 'Unable to communicate with Paystack.', 502);
  }

  return payload.data;
}

export function getTrainingFeeInKobo() {
  if (!environment.TRAINING_FEE_NGN) {
    throw new AppError('The training fee has not been configured.', 503);
  }

  return Math.round(environment.TRAINING_FEE_NGN * 100);
}

export async function initializePaystackTransaction({ email, amountInKobo, reference, metadata }) {
  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: amountInKobo,
      reference,
      callback_url: environment.PAYSTACK_CALLBACK_URL,
      metadata,
    }),
  });
}

export async function verifyPaystackTransaction(reference) {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function verifyPaystackSignature(rawBody, signature) {
  if (!signature || !environment.PAYSTACK_SECRET_KEY) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha512', environment.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}
