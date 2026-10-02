import { v2 as cloudinary } from 'cloudinary';
import environment from './env.js';

export function isCloudinaryConfigured() {
  return Boolean(
    environment.CLOUDINARY_CLOUD_NAME
    && environment.CLOUDINARY_API_KEY
    && environment.CLOUDINARY_API_SECRET,
  );
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: environment.CLOUDINARY_CLOUD_NAME,
    api_key: environment.CLOUDINARY_API_KEY,
    api_secret: environment.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };
