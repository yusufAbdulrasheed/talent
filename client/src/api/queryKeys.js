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
};
