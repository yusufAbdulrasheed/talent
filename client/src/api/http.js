import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

// The access token lives in memory only. Persisting it to localStorage would
// expose it to any XSS on the page; the httpOnly refresh cookie is what
// survives a reload, and `bootstrapSession` trades it for a fresh access token.
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token ?? null;
}

export function getAccessToken() {
  return accessToken;
}

export const http = axios.create({ baseURL, withCredentials: true });

// A bare client for the refresh call itself, so a failing refresh can never
// re-enter the interceptor below and recurse.
const refreshClient = axios.create({ baseURL, withCredentials: true });

let sessionExpiredHandler = () => {};

export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
}

let refreshRequest = null;

/**
 * Exchanges the refresh cookie for a new access token. Concurrent callers
 * share one in-flight request so a burst of 401s triggers a single refresh.
 *
 * @returns {Promise<object>} the refreshed user
 */
export function refreshSession() {
  if (!refreshRequest) {
    refreshRequest = refreshClient
      .post('/auth/refresh')
      .then((response) => {
        const { user, accessToken: token } = response.data.data;
        setAccessToken(token);
        return user;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

http.interceptors.response.use(null, async (error) => {
  const { config, response } = error;

  if (response?.status !== 401 || !config || config.skipAuthRefresh || config.hasRetried) {
    throw error;
  }

  config.hasRetried = true;

  try {
    await refreshSession();
  } catch {
    setAccessToken(null);
    sessionExpiredHandler();
    throw error;
  }

  return http(config);
});

/**
 * Pulls the human-readable message out of an API error, falling back to
 * something usable for network failures and unexpected shapes.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}
