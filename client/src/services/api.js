import axios from 'axios';
import { getToken, clearAuth } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request
client.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear auth and redirect to login
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Thin wrappers that return response.data directly
export const api = {
  get:    (url, config)       => client.get(url, config).then(r => r.data),
  post:   (url, data, config) => client.post(url, data, config).then(r => r.data),
  put:    (url, data, config) => client.put(url, data, config).then(r => r.data),
  delete: (url, config)       => client.delete(url, config).then(r => r.data),
};
