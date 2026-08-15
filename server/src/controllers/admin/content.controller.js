import PublicContent from '../../models/public-content.model.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { paginate } from '../../utils/pagination.js';

export const listContent = asyncHandler(async (request, response) => {
  const { type, page, limit } = request.validatedQuery;
  const query = type ? { type } : {};

  const { items, pagination } = await paginate(PublicContent, {
    query,
    page,
    limit,
    sort: { type: 1, sortOrder: 1, createdAt: -1 },
  });

  sendSuccess(response, { data: { content: items, pagination } });
});

export const createContent = asyncHandler(async (request, response) => {
  const content = await PublicContent.create(request.validated);
  sendSuccess(response, { status: 201, message: 'Content created.', data: { content } });
});

export const updateContent = asyncHandler(async (request, response) => {
  const content = await PublicContent.findById(request.params.id);

  if (!content) {
    throw new AppError('Content item not found.', 404);
  }

  Object.assign(content, request.validated);
  await content.save();

  sendSuccess(response, { message: 'Content updated.', data: { content } });
});

export const deleteContent = asyncHandler(async (request, response) => {
  const content = await PublicContent.findByIdAndDelete(request.params.id);

  if (!content) {
    throw new AppError('Content item not found.', 404);
  }

  sendSuccess(response, { message: 'Content deleted.' });
});
