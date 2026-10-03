export function cldImage(url, { width, height } = {}) {
  if (
    typeof url !== 'string'
    || !url.includes('res.cloudinary.com')
    || !url.includes('/image/upload/')
  ) {
    return url;
  }

  const [head, tail] = url.split('/image/upload/');

  if (/^[a-z]{1,3}_[^/]+\//.test(tail)) {
    return url;
  }

  const parts = ['f_auto', 'q_auto'];
  if (width) parts.push(`w_${Math.round(width)}`);
  if (height) parts.push(`h_${Math.round(height)}`);
  parts.push(width && height ? 'c_fill' : 'c_limit');

  return `${head}/image/upload/${parts.join(',')}/${tail}`;
}
