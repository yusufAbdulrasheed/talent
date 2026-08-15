/**
 * Central registry of TanStack Query keys.
 *
 * Every key is an array starting with a stable scope string so a whole scope
 * can be invalidated at once, e.g.
 *   queryClient.invalidateQueries({ queryKey: queryKeys.talent.all })
 *
 * Add new scopes here rather than inlining literals at call sites.
 */
export const queryKeys = {
  auth: {
    all: ['auth'],
    session: ['auth', 'session'],
  },
  talent: {
    all: ['talent'],
    profile: ['talent', 'profile'],
  },
  payments: {
    all: ['payments'],
    mine: ['payments', 'mine'],
    status: (reference) => ['payments', 'status', reference],
  },
  recruiter: {
    all: ['recruiter'],
    company: ['recruiter', 'company'],
    talentPool: (filters) => ['recruiter', 'talent-pool', filters],
    candidate: (reference) => ['recruiter', 'candidate', reference],
    requests: (params) => ['recruiter', 'requests', params],
    request: (id) => ['recruiter', 'request', id],
    summary: ['recruiter', 'summary'],
  },
  trainer: {
    all: ['trainer'],
    dashboard: ['trainer', 'dashboard'],
  },
  admin: {
    all: ['admin'],
    dashboard: ['admin', 'dashboard'],
    candidates: (params) => ['admin', 'candidates', params],
    candidate: (id) => ['admin', 'candidate', id],
    recruiters: (params) => ['admin', 'recruiters', params],
    trainers: (params) => ['admin', 'trainers', params],
    programs: (params) => ['admin', 'programs', params],
    assignments: (params) => ['admin', 'assignments', params],
    payments: (params) => ['admin', 'payments', params],
    placementRequests: (params) => ['admin', 'placement-requests', params],
    placementRequest: (id) => ['admin', 'placement-request', id],
    content: (params) => ['admin', 'content', params],
  },
};
