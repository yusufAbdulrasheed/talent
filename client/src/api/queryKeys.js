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
    payments: ['talent', 'payments'],
  },
};
