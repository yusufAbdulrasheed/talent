/**
 * Inserts delivery transformations into a Cloudinary image URL. Non-Cloudinary
 * URLs (and raw / non-image assets) are returned untouched, so callers can pass
 * any `imageUrl` value through this safely.
 *
 * @param {string} url
 * @param {{ width?: number, height?: number }} [options]
 */
export function cldImage(url, { width, height } = {}) {
  if (
    typeof url !== 'string'
    || !url.includes('res.cloudinary.com')
    || !url.includes('/image/upload/')
  ) {
    return url;
  }

  const [head, tail] = url.split('/image/upload/');

  // Leave URLs that already carry a transformation segment alone.
  if (/^[a-z]{1,3}_[^/]+\//.test(tail)) {
    return url;
  }

  const parts = ['f_auto', 'q_auto'];
  if (width) parts.push(`w_${Math.round(width)}`);
  if (height) parts.push(`h_${Math.round(height)}`);
  // Fill (and crop) only when both dimensions are fixed; otherwise scale down.
  parts.push(width && height ? 'c_fill' : 'c_limit');

  return `${head}/image/upload/${parts.join(',')}/${tail}`;
}
