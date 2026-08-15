export const CANDIDATE_STATUSES = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

/**
 * How each status is presented: a short label, the tone of its badge, and a
 * plain explanation of where the candidate stands.
 */
export const CANDIDATE_STATUS_DETAILS = Object.freeze({
  [CANDIDATE_STATUSES.DRAFT]: {
    label: 'Draft',
    tone: 'neutral',
    description: 'Your profile is incomplete. Fill in the remaining details to move forward.',
  },
  [CANDIDATE_STATUSES.SUBMITTED]: {
    label: 'Submitted',
    tone: 'info',
    description: 'Your profile is complete. The next step is to pay your training fee.',
  },
  [CANDIDATE_STATUSES.PAYMENT_PENDING]: {
    label: 'Payment pending',
    tone: 'warning',
    description: 'We are waiting for your training fee payment to be confirmed.',
  },
  [CANDIDATE_STATUSES.PAYMENT_CONFIRMED]: {
    label: 'Payment confirmed',
    tone: 'success',
    description: 'Your payment is confirmed. Our team will review your application shortly.',
  },
  [CANDIDATE_STATUSES.UNDER_REVIEW]: {
    label: 'Under review',
    tone: 'info',
    description: 'Our team is reviewing your application and documents.',
  },
  [CANDIDATE_STATUSES.APPROVED]: {
    label: 'Approved',
    tone: 'success',
    description: 'You are approved and visible to recruiters in the talent pool.',
  },
  [CANDIDATE_STATUSES.REJECTED]: {
    label: 'Not approved',
    tone: 'danger',
    description: 'Your application was not approved. See the reviewer note below.',
  },
});

export function getCandidateStatusDetails(status) {
  return (
    CANDIDATE_STATUS_DETAILS[status] ?? {
      label: 'Unknown',
      tone: 'neutral',
      description: 'We could not determine your application status.',
    }
  );
}

export const PAYMENT_STATUS_DETAILS = Object.freeze({
  initialized: { label: 'Awaiting payment', tone: 'warning' },
  success: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  abandoned: { label: 'Abandoned', tone: 'neutral' },
});

export function getPaymentStatusDetails(status) {
  return PAYMENT_STATUS_DETAILS[status] ?? { label: status, tone: 'neutral' };
}

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'two_weeks', label: 'Within two weeks' },
  { value: 'one_month', label: 'Within one month' },
  { value: 'not_available', label: 'Not currently available' },
];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'entry', label: 'Entry level' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid level' },
  { value: 'senior', label: 'Senior' },
];
