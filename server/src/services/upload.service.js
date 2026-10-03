import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/app-error.js';

const ROOT_FOLDER = 'tms';

export function uploadBuffer(buffer, { folder, resourceType = 'auto', filename } = {}) {
  if (!isCloudinaryConfigured()) {
    throw new AppError('File uploads are not configured on this server.', 503);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${ROOT_FOLDER}/${folder}`,
        resource_type: resourceType,
        use_filename: Boolean(filename),
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(`Upload failed: ${error?.message ?? 'unknown error'}`, 502));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format ?? null,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          originalFilename: filename ?? result.original_filename ?? null,
        });
      },
    );

    stream.end(buffer);
  });
}

export async function destroyAsset(publicId, resourceType = 'image') {
  if (!isCloudinaryConfigured() || !publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error(`Unable to remove Cloudinary asset ${publicId}:`, error);
  }
}
