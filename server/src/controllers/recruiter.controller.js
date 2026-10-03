import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { getCompanyForUser, serializeCompany } from '../services/recruiter.service.js';

export const getMyCompany = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  sendSuccess(response, { data: { company: serializeCompany(company) } });
});

export const updateMyCompany = asyncHandler(async (request, response) => {
  const company = await getCompanyForUser(request.user.id);
  const { cacNumber, ...details } = request.validated;

  if (cacNumber !== undefined) {
    if (company.cacNumber && company.cacNumber !== cacNumber.toUpperCase()) {
      throw new AppError('Your CAC number cannot be changed. Contact support if it is wrong.', 403);
    }
    company.cacNumber = cacNumber;
  }

  Object.assign(company, details);
  await company.save();

  sendSuccess(response, { data: { company: serializeCompany(company) } });
});
