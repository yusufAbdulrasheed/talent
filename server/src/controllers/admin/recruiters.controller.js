import RecruiterCompany from '../../models/recruiter-company.model.js';
import PlacementRequest from '../../models/placement-request.model.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { escapeRegex, paginate } from '../../utils/pagination.js';

function serializeCompany(company) {
  const user = company.user;

  return {
    id: company.id ?? company._id?.toString(),
    companyName: company.companyName,
    cacNumber: company.cacNumber,
    businessAddress: company.businessAddress,
    companyEmail: company.companyEmail,
    website: company.website,
    industry: company.industry,
    phoneNumber: company.phoneNumber,
    contactPerson: company.contactPerson,
    isApproved: company.isApproved,
    accountEmail: user?.email ?? null,
    accountName: user ? `${user.firstName} ${user.lastName}` : null,
    isActive: user?.isActive ?? null,
    createdAt: company.createdAt,
  };
}

export const listRecruiters = asyncHandler(async (request, response) => {
  const { isApproved, search, page, limit } = request.validatedQuery;
  const query = {};

  if (isApproved) {
    query.isApproved = isApproved === 'true';
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ companyName: pattern }, { companyEmail: pattern }, { industry: pattern }];
  }

  const { items, pagination } = await paginate(RecruiterCompany, {
    query,
    page,
    limit,
    populate: [{ path: 'user', select: 'firstName lastName email isActive' }],
  });

  sendSuccess(response, { data: { recruiters: items.map(serializeCompany), pagination } });
});

export const getRecruiter = asyncHandler(async (request, response) => {
  const company = await RecruiterCompany.findById(request.params.id).populate({
    path: 'user',
    select: 'firstName lastName email isActive',
  });

  if (!company) {
    throw new AppError('Recruiter company not found.', 404);
  }

  const requestCount = await PlacementRequest.countDocuments({ recruiterCompany: company.id });

  sendSuccess(response, {
    data: { recruiter: serializeCompany(company), placementRequestCount: requestCount },
  });
});

export const setRecruiterApproval = asyncHandler(async (request, response) => {
  const company = await RecruiterCompany.findById(request.params.id).populate({
    path: 'user',
    select: 'firstName lastName email isActive',
  });

  if (!company) {
    throw new AppError('Recruiter company not found.', 404);
  }

  company.isApproved = request.validated.isApproved;
  await company.save();

  sendSuccess(response, {
    message: company.isApproved ? 'Recruiter approved.' : 'Recruiter approval withdrawn.',
    data: { recruiter: serializeCompany(company) },
  });
});
