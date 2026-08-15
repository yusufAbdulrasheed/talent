import { http } from '../http.js';

export async function getTrainerDashboard() {
  const { data } = await http.get('/trainer/dashboard');
  return data.data;
}
