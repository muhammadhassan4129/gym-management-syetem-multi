import axios from 'axios';

export const TOKEN_KEY = 'token';

const API = axios.create({
  baseURL: (
    process.env.REACT_APP_API_URL ||
    'http://localhost:5000/api'
  ).replace(/\/+$/, ''),
  timeout: 60000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  config.sessionToken = token;

  if (!config.skipAuth && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function isStale(config) {
  return (
    !config?.skipAuth &&
    config?.sessionToken !== localStorage.getItem(TOKEN_KEY)
  );
}

API.interceptors.response.use(
  (response) => {
    if (isStale(response.config)) {
      throw new axios.CanceledError('Workspace changed.');
    }

    return response;
  },
  (error) => {
    if (isStale(error.config)) {
      return Promise.reject(
        new axios.CanceledError('Workspace changed.')
      );
    }

    if (
      error.response?.status === 401 &&
      !error.config?.skipAuth &&
      error.config?.sessionToken
    ) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('gym:session-expired'));
    }

    if (
      error.response?.status === 403 &&
      !error.config?.skipAuth
    ) {
      window.dispatchEvent(new Event('gym:refresh-session'));
    }

    return Promise.reject(error);
  }
);

export default API;