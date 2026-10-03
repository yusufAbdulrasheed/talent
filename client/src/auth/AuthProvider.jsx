import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/endpoints/auth.js';
import { refreshSession, setAccessToken, setSessionExpiredHandler } from '../api/http.js';
import { AuthContext } from './AuthContext.js';

const SESSION_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  ANONYMOUS: 'anonymous',
};

function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(SESSION_STATUS.LOADING);
  const bootstrapRequest = useRef(null);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus(SESSION_STATUS.ANONYMOUS);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    return () => setSessionExpiredHandler(() => {});
  }, [clearSession]);

  useEffect(() => {
    let isActive = true;

    bootstrapRequest.current ??= refreshSession();

    bootstrapRequest.current
      .then((restoredUser) => {
        if (isActive) {
          setUser(restoredUser);
          setStatus(SESSION_STATUS.AUTHENTICATED);
        }
      })
      .catch(() => {
        if (isActive) {
          setAccessToken(null);
          setStatus(SESSION_STATUS.ANONYMOUS);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const applySession = useCallback((session) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus(SESSION_STATUS.AUTHENTICATED);
    return session.user;
  }, []);

  const signIn = useCallback(
    async (credentials) => applySession(await authApi.login(credentials)),
    [applySession],
  );

  const signUp = useCallback(
    async (payload) => applySession(await authApi.registerAccount(payload)),
    [applySession],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === SESSION_STATUS.LOADING,
      isAuthenticated: status === SESSION_STATUS.AUTHENTICATED,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, status, signIn, signUp, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
