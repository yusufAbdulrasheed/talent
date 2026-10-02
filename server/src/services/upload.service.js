import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/app-error.js';

const ROOT_FOLDER = 'tms';

/**
 * Streams an in-memory file buffer to Cloudinary.
 *
 * @param {Buffer} buffer
 * @param {object}  options
 * @param {string}  options.folder        Sub-folder under `tms/`, e.g. "content".
 * @param {string} [options.resourceType] "image" | "raw" | "auto" (default "auto").
 * @param {string} [options.filename]     Original name, used as the public id stem.
 * @returns {Promise<{url:string, publicId:string, resourceType:string, format:string, bytes:number, width?:number, height?:number, originalFilename:string}>}
 */
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

/** Removes an asset. Best-effort — a failed delete never blocks the caller. */
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
