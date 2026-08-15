import { http } from '../http.js';

export async function getMyProfile() {
  const { data } = await http.get('/talent/profile');
  return data.data.candidate;
}

export async function updateMyProfile(payload) {
  const { data } = await http.patch('/talent/profile', payload);
  return data.data.candidate;
}
