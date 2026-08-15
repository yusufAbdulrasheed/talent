import { http } from '../http.js';

export async function getDashboard() {
  const { data } = await http.get('/admin/dashboard');
  return data.data;
}

export async function listCandidates(params) {
  const { data } = await http.get('/admin/candidates', { params });
  return data.data;
}

export async function getCandidate(id) {
  const { data } = await http.get(`/admin/candidates/${id}`);
  return data.data;
}

export async function updateCandidateStatus({ id, ...payload }) {
  const { data } = await http.patch(`/admin/candidates/${id}/status`, payload);
  return data.data.candidate;
}

export async function listRecruiters(params) {
  const { data } = await http.get('/admin/recruiters', { params });
  return data.data;
}

export async function setRecruiterApproval({ id, isApproved }) {
  const { data } = await http.patch(`/admin/recruiters/${id}/approval`, { isApproved });
  return data.data.recruiter;
}

export async function listTrainers(params) {
  const { data } = await http.get('/admin/trainers', { params });
  return data.data;
}

export async function createTrainer(payload) {
  const { data } = await http.post('/admin/trainers', payload);
  return data.data.trainer;
}

export async function setTrainerStatus({ id, isActive }) {
  const { data } = await http.patch(`/admin/trainers/${id}/status`, { isActive });
  return data.data.trainer;
}

export async function listPrograms(params) {
  const { data } = await http.get('/admin/programs', { params });
  return data.data;
}

export async function createProgram(payload) {
  const { data } = await http.post('/admin/programs', payload);
  return data.data.program;
}

export async function updateProgram({ id, ...payload }) {
  const { data } = await http.patch(`/admin/programs/${id}`, payload);
  return data.data.program;
}

export async function listAssignments(params) {
  const { data } = await http.get('/admin/assignments', { params });
  return data.data;
}

export async function createAssignment(payload) {
  const { data } = await http.post('/admin/assignments', payload);
  return data.data.assignment;
}

export async function listPayments(params) {
  const { data } = await http.get('/admin/payments', { params });
  return data.data;
}

export async function listAdminPlacementRequests(params) {
  const { data } = await http.get('/admin/placement-requests', { params });
  return data.data;
}

export async function getAdminPlacementRequest(id) {
  const { data } = await http.get(`/admin/placement-requests/${id}`);
  return data.data.placementRequest;
}

export async function updatePlacementRequestStatus({ id, ...payload }) {
  const { data } = await http.patch(`/admin/placement-requests/${id}/status`, payload);
  return data.data.placementRequest;
}

export async function listContent(params) {
  const { data } = await http.get('/admin/content', { params });
  return data.data;
}

export async function createContent(payload) {
  const { data } = await http.post('/admin/content', payload);
  return data.data.content;
}

export async function updateContent({ id, ...payload }) {
  const { data } = await http.patch(`/admin/content/${id}`, payload);
  return data.data.content;
}

export async function deleteContent(id) {
  await http.delete(`/admin/content/${id}`);
}
