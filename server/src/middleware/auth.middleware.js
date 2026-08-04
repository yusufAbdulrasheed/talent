import jwt from 'jsonwebtoken';
import environment from '../config/env.js';
import User from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

export const authenticate = asyncHandler(async (request, _response, next) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError('Authentication is required.', 401);
  }

  if (!environment.JWT_ACCESS_SECRET) {
    throw new AppError('Authentication is not configured.', 503);
  }

  try {
    const payload = jwt.verify(authorization.slice(7), environment.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new AppError('Authentication is required.', 401);
    }

    request.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Authentication is required.', 401);
  }
});

export function authorize(...roles) {
  return (request, _response, next) => {
    if (!roles.includes(request.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    return next();
  };
}
