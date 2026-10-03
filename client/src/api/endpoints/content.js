import { http } from '../http.js';

export async function listPublicContent(params) {
  const { data } = await http.get('/content', { params, skipAuthRefresh: true });
  return data.data; 
}

export async function getPublicContentItem(id) {
  const { data } = await http.get(`/content/${id}`, { skipAuthRefresh: true });
  return data.data.content;
}

export async function sendContactMessage(payload) {
  const { data } = await http.post('/contact', payload, { skipAuthRefresh: true });
  return data;
}
