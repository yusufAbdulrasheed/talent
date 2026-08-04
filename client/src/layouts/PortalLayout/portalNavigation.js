import { USER_ROLES } from '../../auth/roles.js';

/**
 * Sidebar links per role. Every path here must have a matching route in
 * AppRoutes.jsx, and a matching API guard on the server.
 */
export const PORTAL_NAVIGATION = {
  [USER_ROLES.TALENT]: [
    { to: '/talent', label: 'Overview', end: true },
    { to: '/talent/profile', label: 'My profile' },
    { to: '/talent/documents', label: 'Documents' },
    { to: '/talent/payments', label: 'Payments' },
  ],
  [USER_ROLES.RECRUITER]: [
    { to: '/recruiter', label: 'Overview', end: true },
    { to: '/recruiter/company', label: 'Company profile' },
    { to: '/recruiter/talent-pool', label: 'Find talent' },
    { to: '/recruiter/requests', label: 'Placement requests' },
  ],
  [USER_ROLES.TRAINER]: [
    { to: '/trainer', label: 'Overview', end: true },
    { to: '/trainer/assignments', label: 'My assignments' },
  ],
  [USER_ROLES.ADMIN]: [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/candidates', label: 'Candidates' },
    { to: '/admin/recruiters', label: 'Recruiters' },
    { to: '/admin/trainers', label: 'Trainers' },
    { to: '/admin/programs', label: 'Programs & batches' },
    { to: '/admin/payments', label: 'Payments' },
    { to: '/admin/placement-requests', label: 'Placement requests' },
    { to: '/admin/content', label: 'Website content' },
  ],
};

export function getPortalNavigation(role) {
  return PORTAL_NAVIGATION[role] ?? [];
}
