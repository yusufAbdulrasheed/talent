/**
 * Standard success envelope for every endpoint:
 *   { success: true, message?: string, data?: object }
 *
 * Failures are shaped by the error middleware as:
 *   { success: false, message: string, details?: array }
 */
export function sendSuccess(response, { status = 200, data, message } = {}) {
  const body = { success: true };

  if (message) {
    body.message = message;
  }

  if (data !== undefined) {
    body.data = data;
  }

  return response.status(status).json(body);
}

export function sendNoContent(response) {
  return response.status(204).send();
}
