import { AppError } from '../utils/app-error.js';

function toFieldErrors(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(body)',
    message: issue.message,
  }));
}

export function validateBody(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return next(new AppError('Invalid request data.', 422, toFieldErrors(result.error)));
    }

    request.validated = result.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.query);

    if (!result.success) {
      return next(new AppError('Invalid query parameters.', 422, toFieldErrors(result.error)));
    }

    request.validatedQuery = result.data;
    return next();
  };
}
