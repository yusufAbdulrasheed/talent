export const PLACEMENT_REQUEST_STATUSES = Object.freeze({
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  IN_PROGRESS: 'in_progress',
  FULFILLED: 'fulfilled',
  CLOSED: 'closed',
});

export const PLACEMENT_REQUEST_STATUS_DETAILS = Object.freeze({
  [PLACEMENT_REQUEST_STATUSES.SUBMITTED]: {
    label: 'Submitted',
    tone: 'info',
    description: 'Your request has been received and is queued for review.',
  },
  [PLACEMENT_REQUEST_STATUSES.UNDER_REVIEW]: {
    label: 'Under review',
    tone: 'warning',
    description: 'Our team is reviewing your request.',
  },
  [PLACEMENT_REQUEST_STATUSES.IN_PROGRESS]: {
    label: 'In progress',
    tone: 'info',
    description: 'We are arranging the placement with the candidate.',
  },
  [PLACEMENT_REQUEST_STATUSES.FULFILLED]: {
    label: 'Fulfilled',
    tone: 'success',
    description: 'This placement request has been fulfilled.',
  },
  [PLACEMENT_REQUEST_STATUSES.CLOSED]: {
    label: 'Closed',
    tone: 'neutral',
    description: 'This request has been closed.',
  },
});

export function getPlacementRequestStatusDetails(status) {
  return (
    PLACEMENT_REQUEST_STATUS_DETAILS[status] ?? {
      label: status ?? 'Unknown',
      tone: 'neutral',
      description: '',
    }
  );
}

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

export const PLACEMENT_STATUS_FILTER_OPTIONS = Object.entries(PLACEMENT_REQUEST_STATUS_DETAILS).map(
  ([value, { label }]) => ({ value, label }),
);

export function getEmploymentTypeLabel(value) {
  return EMPLOYMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
