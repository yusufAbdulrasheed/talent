import { http } from '../http.js';

export async function uploadFile(file, { folder = 'misc' } = {}) {
  const body = new FormData();
  body.append('folder', folder);
  body.append('file', file);

  const { data } = await http.post('/uploads', body);
  return data.data.asset;
}
