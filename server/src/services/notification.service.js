import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { sendEmail } from './email.service.js';
import { paymentReceiptEmail, placementRequestEmail } from './email-templates.js';

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

/**
 * Tells every administrator that a recruiter has submitted a placement
 * request, in-app and by email.
 *
 * Notifying is best-effort: a mail outage must not roll back a request the
 * recruiter has already successfully submitted.
 */
export async function notifyAdminsOfPlacementRequest({ request, companyName }) {
  const admins = await User.find({ role: USER_ROLES.ADMIN, isActive: true }).select('email firstName');

  if (admins.length === 0) {
    console.warn('A placement request was submitted but no active administrator exists to notify.');
    return;
  }

  const title = 'New placement request';
  const message = `${companyName} requested ${request.candidateReference} for ${request.jobTitle}.`;

  await Notification.insertMany(
    admins.map((admin) => ({
      recipient: admin.id,
      type: 'placement_request.submitted',
      title,
      message,
      metadata: { placementRequestId: request.id },
    })),
  );

  const email = placementRequestEmail({ companyName, ...request });

  await Promise.allSettled(admins.map((admin) => sendEmail({ to: admin.email, ...email })));
}
