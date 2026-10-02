import { http } from '../http.js';

/**
 * Published marketing content managed by an admin in Content Studio.
 * `type` is one of: post | event | testimonial | gallery_item | faq.
 */
export async function listPublicContent(params) {
  const { data } = await http.get('/content', { params, skipAuthRefresh: true });
  return data.data; // { content, pagination }
}

export async function getPublicContentItem(id) {
  const { data } = await http.get(`/content/${id}`, { skipAuthRefresh: true });
  return data.data.content;
}

export async function sendContactMessage(payload) {
  const { data } = await http.post('/contact', payload, { skipAuthRefresh: true });
  return data;
}
