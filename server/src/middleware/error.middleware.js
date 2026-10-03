import environment from '../config/env.js';

export function notFoundHandler(request, response) {
  response.status(404).json({
    success: false,
    message: `Route ${request.method} ${request.originalUrl} was not found.`,
  });
}

export function errorHandler(error, _request, response, _next) {
  if (error.name === 'ValidationError') {
    return response.status(422).json({ success: false, message: 'Invalid request data.' });
  }

  if (error.code === 11000) {
    return response.status(409).json({ success: false, message: 'A record with this value already exists.' });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500 && environment.NODE_ENV !== 'test') {
    console.error('Unhandled API error:', error);
  }

  const body = {
    success: false,
    message: statusCode === 500 ? 'An unexpected server error occurred.' : error.message,
  };

  if (error.details) {
    body.details = error.details;
  }

  return response.status(statusCode).json(body);
}
