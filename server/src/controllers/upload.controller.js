import { z } from 'zod';
import { USER_ROLES } from '../constants/user-roles.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { uploadBuffer } from '../services/upload.service.js';

const FOLDERS = {
  content: [USER_ROLES.ADMIN],
  gallery: [USER_ROLES.ADMIN],
  documents: [USER_ROLES.TALENT, USER_ROLES.ADMIN],
  companies: [USER_ROLES.RECRUITER, USER_ROLES.ADMIN],
  avatars: Object.values(USER_ROLES),
  misc: Object.values(USER_ROLES),
};

const bodySchema = z
  .object({ folder: z.enum(Object.keys(FOLDERS)).default('misc') })
  .passthrough();

const RESOURCE_TYPE = {
  'application/pdf': 'raw',
};

export const createUpload = asyncHandler(async (request, response) => {
  if (!request.file) {
    throw new AppError('No file was provided. Send it as multipart field "file".', 400);
  }

  const { folder } = bodySchema.parse(request.body);

  if (!FOLDERS[folder].includes(request.user.role)) {
    throw new AppError('You are not allowed to upload to this folder.', 403);
  }

  const asset = await uploadBuffer(request.file.buffer, {
    folder,
    resourceType: RESOURCE_TYPE[request.file.mimetype] ?? 'image',
    filename: request.file.originalname,
  });

  sendSuccess(response, { status: 201, message: 'File uploaded.', data: { asset } });
});
