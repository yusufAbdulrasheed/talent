import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { getCandidateForUser } from '../services/candidate.service.js';
import {
  getOrCreateSavings,
  requestWithdrawal as requestWithdrawalService,
  serializeSavings,
  setParticipationStatus,
} from '../services/talent-savings.service.js';
import { notifyAdminsOfWithdrawalRequest } from '../services/notification.service.js';

export const getMySavings = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  const savings = await getOrCreateSavings(candidate.id);

  sendSuccess(response, { data: { savings: serializeSavings(savings) } });
});

export const requestWithdrawal = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  const savings = await requestWithdrawalService(candidate.id, request.validated.amount);

  try {
    await notifyAdminsOfWithdrawalRequest({ candidate, amount: request.validated.amount });
  } catch (error) {
    console.error('Unable to notify administrators of a withdrawal request:', error);
  }

  sendSuccess(response, {
    status: 201,
    message: 'Withdrawal request submitted.',
    data: { savings: serializeSavings(savings) },
  });
});

export const setParticipation = asyncHandler(async (request, response) => {
  const candidate = await getCandidateForUser(request.user.id);
  const savings = await setParticipationStatus(candidate.id, request.validated.status);

  sendSuccess(response, { data: { savings: serializeSavings(savings) } });
});
