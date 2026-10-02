import { http } from '../http.js';

export async function getMySavings() {
  const { data } = await http.get('/talent/savings');
  return data.data.savings;
}

export async function requestWithdrawal(payload) {
  const { data } = await http.post('/talent/savings/withdrawals', payload);
  return data.data.savings;
}

export async function setSavingsParticipation(payload) {
  const { data } = await http.patch('/talent/savings/participation', payload);
  return data.data.savings;
}
