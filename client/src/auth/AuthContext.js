import { createContext } from 'react';

/**
 * Session state and the actions that change it.
 * Consume through the `useAuth` hook rather than directly.
 */
export const AuthContext = createContext(null);
