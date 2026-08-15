import { http } from '../http.js';

export async function initializeTrainingPayment() {
  const { data } = await http.post('/payments/training/initialize');
  return data.data;
}

export async function getMyPayments() {
  const { data } = await http.get('/payments/me');
  return data.data.payments;
}

export async function getPaymentStatus(reference) {
  const { data } = await http.get(`/payments/${encodeURIComponent(reference)}/status`);
  return data.data;
}
