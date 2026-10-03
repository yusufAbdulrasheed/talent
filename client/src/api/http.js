import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token ?? null;
}

export function getAccessToken() {
  return accessToken;
}

export const http = axios.create({ baseURL, withCredentials: true });

const refreshClient = axios.create({ baseURL, withCredentials: true });

let sessionExpiredHandler = () => {};

export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
}

let refreshRequest = null;

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

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}
