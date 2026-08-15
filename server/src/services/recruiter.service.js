import RecruiterCompany from '../models/recruiter-company.model.js';
import { AppError } from '../utils/app-error.js';

export async function getCompanyForUser(userId) {
  const company = await RecruiterCompany.findOne({ user: userId });

  if (!company) {
    throw new AppError('Recruiter company profile not found.', 404);
  }

  return company;
}

const REQUIRED_FOR_COMPLETION = ['companyName', 'companyEmail', 'businessAddress', 'industry', 'phoneNumber', 'contactPerson'];

export function serializeCompany(company) {
  return {
    id: company.id,
    companyName: company.companyName,
    cacNumber: company.cacNumber,
    businessAddress: company.businessAddress,
    companyEmail: company.companyEmail,
    website: company.website,
    industry: company.industry,
    phoneNumber: company.phoneNumber,
    contactPerson: company.contactPerson,
    isApproved: company.isApproved,
    isProfileComplete: REQUIRED_FOR_COMPLETION.every((field) => Boolean(company[field])),
  };
}
