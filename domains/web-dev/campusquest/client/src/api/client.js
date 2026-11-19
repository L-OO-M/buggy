import axios from 'axios';

export const TOKEN_KEY = 'campusquest.token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('campusquest:auth-expired'));
    }
    const message =
      error.response?.data?.error?.message ||
      (error.code === 'ECONNABORTED' ? 'The server took too long to respond.' : null) ||
      error.message ||
      'Something went wrong';
    return Promise.reject(Object.assign(error, { friendlyMessage: message }));
  },
);

export function unwrap(response) {
  return response.data.data;
}

export function unwrapWithMeta(response) {
  return { data: response.data.data, meta: response.data.meta || {} };
}

export default api;
