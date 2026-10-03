import Payment from '../../models/payment.model.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { escapeRegex, paginate } from '../../utils/pagination.js';

function serializePayment(payment) {
  const candidate = payment.candidate;
  const recruiterCompany = payment.recruiterCompany;

  return {
    id: payment.id ?? payment._id?.toString(),
    reference: payment.reference,
    purpose: payment.purpose,
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    candidateReference: candidate?.referenceNumber ?? null,
    candidateId: candidate?._id?.toString() ?? null,
    recruiterCompanyName: recruiterCompany?.companyName ?? null,
    subscriptionTier: payment.subscriptionTier ?? null,
  };
}

export const listPayments = asyncHandler(async (request, response) => {
  const { status, reference, purpose, page, limit } = request.validatedQuery;
  const query = {};

  if (status) {
    query.status = status;
  }

  if (purpose) {
    query.purpose = purpose;
  }

  if (reference) {
    query.reference = new RegExp(escapeRegex(reference), 'i');
  }

  const { items, pagination } = await paginate(Payment, {
    query,
    page,
    limit,
    select: '-providerPayload',
    populate: [
      { path: 'candidate', select: 'referenceNumber' },
      { path: 'recruiterCompany', select: 'companyName' },
    ],
  });

  sendSuccess(response, { data: { payments: items.map(serializePayment), pagination } });
});

export const getPayment = asyncHandler(async (request, response) => {
  const payment = await Payment.findById(request.params.id)
    .populate({ path: 'candidate', select: 'referenceNumber status' })
    .populate({ path: 'recruiterCompany', select: 'companyName' });

  if (!payment) {
    throw new AppError('Payment not found.', 404);
  }

  sendSuccess(response, {
    data: {
      payment: {
        ...serializePayment(payment),
        candidateStatus: payment.candidate?.status ?? null,
        providerPayload: payment.providerPayload ?? null,
      },
    },
  });
});
