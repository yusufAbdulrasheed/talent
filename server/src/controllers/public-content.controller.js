import mongoose from 'mongoose';
import PublicContent from '../models/public-content.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { paginate } from '../utils/pagination.js';

const PUBLIC_FIELDS = 'type title body excerpt author imageUrl eventDate createdAt updatedAt';

function sortFor(type) {
  if (type === 'event') {
    return { eventDate: -1, createdAt: -1 };
  }

  if (type === 'post') {
    return { createdAt: -1 };
  }

  return { sortOrder: 1, createdAt: -1 };
}

export const listPublicContent = asyncHandler(async (request, response) => {
  const { type, page, limit } = request.validatedQuery;
  const query = { isPublished: true, ...(type ? { type } : {}) };

  const { items, pagination } = await paginate(PublicContent, {
    query,
    page,
    limit,
    select: PUBLIC_FIELDS,
    sort: sortFor(type),
  });

  sendSuccess(response, { data: { content: items, pagination } });
});

export const getPublicContentItem = asyncHandler(async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    throw new AppError('Content item not found.', 404);
  }

  const content = await PublicContent.findOne({
    _id: request.params.id,
    isPublished: true,
  }).select(PUBLIC_FIELDS);

  if (!content) {
    throw new AppError('Content item not found.', 404);
  }

  sendSuccess(response, { data: { content } });
});
