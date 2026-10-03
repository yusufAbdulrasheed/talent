import {
  Briefcase,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Newspaper,
  PiggyBank,
  UserRound,
  UserSearch,
  Users,
  Wallet,
} from 'lucide-react';
import { USER_ROLES } from '../../auth/roles.js';

export const PORTAL_NAVIGATION = {
  [USER_ROLES.TALENT]: [
    { to: '/talent', label: 'Overview', end: true, icon: LayoutDashboard },
    { to: '/talent/profile', label: 'My profile', icon: UserRound },
    { to: '/talent/savings', label: 'Savings', icon: PiggyBank },
  ],
  [USER_ROLES.RECRUITER]: [
    { to: '/recruiter', label: 'Overview', end: true, icon: LayoutDashboard },
    { to: '/recruiter/company', label: 'Company profile', icon: Briefcase },
    { to: '/recruiter/talent-pool', label: 'Find talent', icon: Users },
    { to: '/recruiter/requests', label: 'Placement requests', icon: ClipboardList },
    { to: '/recruiter/subscription', label: 'Subscription', icon: CreditCard },
  ],
  [USER_ROLES.TRAINER]: [
    { to: '/trainer', label: 'Overview', end: true, icon: LayoutDashboard },
    { to: '/trainer/assignments', label: 'My assignments', icon: GraduationCap },
  ],
  [USER_ROLES.ADMIN]: [
    { to: '/admin', label: 'Overview', end: true, icon: LayoutDashboard },
    { to: '/admin/candidates', label: 'Candidates', icon: UserSearch },
    { to: '/admin/recruiters', label: 'Recruiters', icon: Briefcase },
    { to: '/admin/trainers', label: 'Trainers', icon: GraduationCap },
    { to: '/admin/programs', label: 'Programs & batches', icon: Layers },
    { to: '/admin/payments', label: 'Payments', icon: Wallet },
    { to: '/admin/savings-withdrawals', label: 'Savings withdrawals', icon: PiggyBank },
    { to: '/admin/placement-requests', label: 'Placement requests', icon: ClipboardCheck },
    { to: '/admin/content-studio', label: 'Content Studio', icon: Newspaper },
  ],
};

export const PORTAL_SUBTITLE = {
  [USER_ROLES.TALENT]: 'Talent Console',
  [USER_ROLES.RECRUITER]: 'Recruiter Console',
  [USER_ROLES.TRAINER]: 'Trainer Console',
  [USER_ROLES.ADMIN]: 'Admin Console',
};

export const PORTAL_SEARCH = {
  [USER_ROLES.RECRUITER]: { to: '/recruiter/talent-pool', param: 'search', placeholder: 'Search the talent pool…' },
  [USER_ROLES.ADMIN]: { to: '/admin/candidates', param: 'search', placeholder: 'Search candidates…' },
};

export function getPortalNavigation(role) {
  return PORTAL_NAVIGATION[role] ?? [];
}
