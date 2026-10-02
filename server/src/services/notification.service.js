import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { sendEmail } from './email.service.js';
import {
  candidateApprovedEmail,
  candidateRejectedEmail,
  placementRequestEmail,
  placementRequestStatusEmail,
  savingsWithdrawalDecisionEmail,
  savingsWithdrawalRequestEmail,
} from './email-templates.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';

/** Records an in-app notification for a single recipient. */
export async function notifyUser({ recipient, type, title, message, metadata }) {
  return Notification.create({ recipient, type, title, message, metadata });
}

/**
 * Emails a candidate the outcome of their review, and records it in-app.
 * Expects `candidate.user` populated.
 */
export async function sendCandidateDecisionEmail(candidate, status, note) {
  const user = candidate.user;

  if (!user?.email) {
    return;
  }

  const isApproved = status === CANDIDATE_STATUSES.APPROVED;
  const message = isApproved
    ? candidateApprovedEmail({ firstName: user.firstName, referenceNumber: candidate.referenceNumber })
    : candidateRejectedEmail({
      firstName: user.firstName,
      referenceNumber: candidate.referenceNumber,
      note,
    });

  await notifyUser({
    recipient: user.id ?? user._id,
    type: `candidate.${status}`,
    title: isApproved ? 'Application approved' : 'Application decision',
    message: isApproved
      ? 'Your application has been approved and your profile is now in the talent pool.'
      : 'Your application was not approved. See the reviewer note on your dashboard.',
  });

  await sendEmail({ to: user.email, ...message });
}

/**
 * Tells a recruiter their placement request has moved on.
 * Expects `request.recruiterCompany` populated with its `user`.
 */
export async function sendPlacementStatusEmail(placementRequest, candidateReference) {
  const company = placementRequest.recruiterCompany;
  const recipientEmail = company?.companyEmail ?? company?.user?.email;

  if (!recipientEmail) {
    return;
  }

  const message = placementRequestStatusEmail({
    contactPerson: company.contactPerson || company.companyName,
    jobTitle: placementRequest.jobTitle,
    candidateReference,
    status: placementRequest.status,
    note: placementRequest.adminNote,
  });

  if (company.user) {
    await notifyUser({
      recipient: company.user._id ?? company.user,
      type: `placement_request.${placementRequest.status}`,
      title: 'Placement request updated',
      message: `“${placementRequest.jobTitle}” is now ${placementRequest.status.replaceAll('_', ' ')}.`,
      metadata: { placementRequestId: placementRequest.id },
    });
  }

  await sendEmail({ to: recipientEmail, ...message });
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
  const count = request.candidateCount ?? 1;
  const message =
    count > 1
      ? `${companyName} requested ${count} talents (${request.candidateReference}) for ${request.jobTitle}.`
      : `${companyName} requested ${request.candidateReference} for ${request.jobTitle}.`;

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

/**
 * Tells every administrator that a talent has requested a savings
 * withdrawal, in-app and by email. Best effort, mirroring
 * `notifyAdminsOfPlacementRequest` — a mail outage must not roll back a
 * request the talent has already successfully submitted.
 */
export async function notifyAdminsOfWithdrawalRequest({ candidate, amount }) {
  const admins = await User.find({ role: USER_ROLES.ADMIN, isActive: true }).select('email firstName');

  if (admins.length === 0) {
    console.warn('A withdrawal request was submitted but no active administrator exists to notify.');
    return;
  }

  const title = 'New savings withdrawal request';
  const message = `${candidate.referenceNumber} requested a withdrawal of ${amount}.`;

  await Notification.insertMany(
    admins.map((admin) => ({
      recipient: admin.id,
      type: 'savings.withdrawal_requested',
      title,
      message,
      metadata: { candidateId: candidate.id },
    })),
  );

  const email = savingsWithdrawalRequestEmail({ referenceNumber: candidate.referenceNumber, amount });

  await Promise.allSettled(admins.map((admin) => sendEmail({ to: admin.email, ...email })));
}

/**
 * Tells a talent the outcome of their withdrawal request, in-app and by
 * email. Expects `candidate.user` populated.
 */
export async function notifyTalentOfWithdrawalDecision(candidate, withdrawalRequest) {
  const user = candidate.user;

  if (!user?.email) {
    return;
  }

  const isApproved = withdrawalRequest.status === 'approved';

  await notifyUser({
    recipient: user.id ?? user._id,
    type: `savings.withdrawal_${withdrawalRequest.status}`,
    title: isApproved ? 'Withdrawal approved' : 'Withdrawal request update',
    message: isApproved
      ? `Your withdrawal request for ${withdrawalRequest.amount} has been approved.`
      : `Your withdrawal request for ${withdrawalRequest.amount} was not approved. See the note on your dashboard.`,
  });

  const email = savingsWithdrawalDecisionEmail({
    firstName: user.firstName,
    amount: withdrawalRequest.amount,
    status: withdrawalRequest.status,
    decisionNote: withdrawalRequest.decisionNote,
  });

  await sendEmail({ to: user.email, ...email });
}
