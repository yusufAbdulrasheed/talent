import Payment from '../../models/payment.model.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { escapeRegex, paginate } from '../../utils/pagination.js';

function serializePayment(payment) {
  const candidate = payment.candidate;

  return {
    id: payment.id ?? payment._id?.toString(),
    reference: payment.reference,
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    candidateReference: candidate?.referenceNumber ?? null,
    candidateId: candidate?._id?.toString() ?? null,
  };
}

export const listPayments = asyncHandler(async (request, response) => {
  const { status, reference, page, limit } = request.validatedQuery;
  const query = {};

  if (status) {
    query.status = status;
  }

  if (reference) {
    query.reference = new RegExp(escapeRegex(reference), 'i');
  }

  const { items, pagination } = await paginate(Payment, {
    query,
    page,
    limit,
    // The raw provider payload stays out of list responses; it is large and
    // only useful when investigating a single transaction.
    select: '-providerPayload',
    populate: [{ path: 'candidate', select: 'referenceNumber' }],
  });

  sendSuccess(response, { data: { payments: items.map(serializePayment), pagination } });
});

export const getPayment = asyncHandler(async (request, response) => {
  const payment = await Payment.findById(request.params.id).populate({
    path: 'candidate',
    select: 'referenceNumber status',
  });

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
