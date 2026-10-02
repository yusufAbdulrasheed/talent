import { http } from '../http.js';

/**
 * Uploads a single file to Cloudinary via the API and returns the stored asset
 * ({ url, publicId, resourceType, format, bytes, width, height }).
 *
 * @param {File} file
 * @param {{ folder?: string }} [options] folder must be one the API allows for
 *   the current role, e.g. "content" for admins.
 */
export async function uploadFile(file, { folder = 'misc' } = {}) {
  const body = new FormData();
  body.append('folder', folder);
  body.append('file', file);

  const { data } = await http.post('/uploads', body);
  return data.data.asset;
}
