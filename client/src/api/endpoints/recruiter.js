import { http } from '../http.js';

export async function getMyCompany() {
  const { data } = await http.get('/recruiter/company');
  return data.data.company;
}

export async function updateMyCompany(payload) {
  const { data } = await http.patch('/recruiter/company', payload);
  return data.data.company;
}

export async function searchTalentPool(filters) {
  const { data } = await http.get('/recruiter/talent-pool', { params: filters });
  return data.data;
}

export async function getPoolCandidate(reference) {
  const { data } = await http.get(`/recruiter/talent-pool/${encodeURIComponent(reference)}`);
  return data.data.candidate;
}

export async function getMySubscription() {
  const { data } = await http.get('/recruiter/subscription');
  return data.data.subscription;
}

export async function initializeSubscriptionCheckout(payload) {
  const { data } = await http.post('/recruiter/subscription/checkout', payload);
  return data.data;
}

export async function getSubscriptionCheckoutStatus(reference) {
  const { data } = await http.get(`/recruiter/subscription/checkout/${encodeURIComponent(reference)}/status`);
  return data.data;
}

export async function getRequestSummary() {
  const { data } = await http.get('/recruiter/placement-requests/summary');
  return data.data.summary;
}

export async function listPlacementRequests(params) {
  const { data } = await http.get('/recruiter/placement-requests', { params });
  return data.data;
}

export async function getPlacementRequest(id) {
  const { data } = await http.get(`/recruiter/placement-requests/${id}`);
  return data.data.placementRequest;
}

export async function createPlacementRequest(payload) {
  const { data } = await http.post('/recruiter/placement-requests', payload);
  return data.data.placementRequest;
}

export async function createGroupPlacementRequest(payload) {
  const { data } = await http.post('/recruiter/placement-requests/group', payload);
  return data.data;
}
