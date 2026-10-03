import { http } from '../http.js';

export async function registerAccount(payload) {
  const { data } = await http.post('/auth/register', payload);
  return data.data;
}

export async function login(credentials) {
  const { data } = await http.post('/auth/login', credentials, { skipAuthRefresh: true });
  return data.data;
}

export async function logout() {
  await http.post('/auth/logout', null, { skipAuthRefresh: true });
}

export async function getCurrentUser() {
  const { data } = await http.get('/auth/me');
  return data.data.user;
}

export async function verifyEmail(token) {
  const { data } = await http.post('/auth/verify-email', { token });
  return data;
}

export async function resendVerification(email) {
  const { data } = await http.post('/auth/resend-verification', { email });
  return data;
}

export async function requestPasswordReset(email) {
  const { data } = await http.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword({ token, password }) {
  const { data } = await http.post('/auth/reset-password', { token, password });
  return data;
}
