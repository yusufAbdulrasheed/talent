export const USER_ROLES = Object.freeze({
  TALENT: 'talent',
  RECRUITER: 'recruiter',
  TRAINER: 'trainer',
  ADMIN: 'admin',
});

export const ROLE_LABELS = Object.freeze({
  [USER_ROLES.TALENT]: 'Talent',
  [USER_ROLES.RECRUITER]: 'Recruiter',
  [USER_ROLES.TRAINER]: 'Trainer',
  [USER_ROLES.ADMIN]: 'Administrator',
});

const ROLE_HOME_PATHS = Object.freeze({
  [USER_ROLES.TALENT]: '/talent',
  [USER_ROLES.RECRUITER]: '/recruiter',
  [USER_ROLES.TRAINER]: '/trainer',
  [USER_ROLES.ADMIN]: '/admin',
});

export function getRoleHomePath(role) {
  return ROLE_HOME_PATHS[role] ?? '/';
}
