import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { getCompanyForUser, serializeCompany } from '../services/recruiter.service.js';

export const getMyCompany = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  sendSuccess(response, { data: { company: serializeCompany(company) } });
});

export const updateMyCompany = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  Object.assign(company, request.validated);
  await company.save();

  sendSuccess(response, { data: { company: serializeCompany(company) } });
});
