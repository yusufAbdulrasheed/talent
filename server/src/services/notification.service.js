import Notification from '../models/notification.model.js';
import { sendEmail } from './email.service.js';
import { paymentReceiptEmail } from './email-templates.js';

/**
 * Emails a receipt for a confirmed payment.
 * Expects `payment.candidate` populated, with `candidate.user` populated too.
 */
export async function sendPaymentReceiptEmail(payment) {
  const candidate = payment.candidate;
  const user = candidate?.user;

  if (!user?.email) {
    return;
  }

  const message = paymentReceiptEmail({
    firstName: user.firstName,
    referenceNumber: candidate.referenceNumber,
    reference: payment.reference,
    amount: payment.amount,
    currency: payment.currency,
    paidAt: payment.paidAt,
  });

  await sendEmail({ to: user.email, ...message });
}

/** Records an in-app notification for a single recipient. */
export async function notifyUser({ recipient, type, title, message, metadata }) {
  return Notification.create({ recipient, type, title, message, metadata });
}
