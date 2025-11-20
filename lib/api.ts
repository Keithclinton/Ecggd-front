import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getSlidingToken, setSlidingToken, clearSlidingToken } from './auth';

// Base for proxy calls (calls /api/proxy/*)
const baseURL = process.env.NEXT_PUBLIC_API_PROXY_PATH || '/api/proxy';

const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token refresh queue
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (err: any) => void; config: AxiosRequestConfig }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else {
      if (token && p.config.headers) p.config.headers['Authorization'] = `Bearer ${token}`;
      p.resolve(p.config);
    }
  });
  failedQueue = [];
};

// Attach token to requests
api.interceptors.request.use(
  (config) => {
    try {
      const token = getSlidingToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor handles 401 -> refresh flow
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        }).then((cfg) => api.request(cfg as AxiosRequestConfig));
      }

      isRefreshing = true;
      try {
        const resp = await fetch('/api/auth/refresh', { method: 'POST' });
        if (!resp.ok) {
          processQueue(new Error('Refresh failed'), null);
          clearSlidingToken();
          isRefreshing = false;
          return Promise.reject(error);
        }

        const data = await resp.json();
        const newAccess = data?.access;
        if (newAccess) {
          setSlidingToken(newAccess);
          processQueue(null, newAccess);
          return api.request({
            ...originalRequest,
            headers: { ...(originalRequest.headers || {}), Authorization: `Bearer ${newAccess}` },
          });
        }

        processQueue(new Error('No access in refresh response'), null);
        clearSlidingToken();
        isRefreshing = false;
        return Promise.reject(error);
      } catch (err) {
        processQueue(err, null);
        clearSlidingToken();
        isRefreshing = false;
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// --- centralized API exports ---

export const auth = {
  login: (username: string, password: string) => api.post('/auth/login/', { username, password }),
  register: (payload: any) => api.post('/auth/register/', payload),
  logout: () => api.post('/auth/logout/'),
  refresh: () => api.post('/auth/refresh/'),
};

export const profile = {
  get: () => api.get('/users/me/'),
  update: (id: number, payload: any) => api.patch(`/users/${id}/`, payload),
  updateWithFiles: (id: number, formData: FormData) => api.patch(`/users/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const courses = {
  list: () => api.get('/courses/'),
  detail: (id: number | string) => api.get(`/courses/${id}/`),
  enroll: (courseId: number | string) => api.post(`/courses/${courseId}/enroll/`),
};

export const assignments = {
  list: () => api.get('/assignments/'),
  submit: (payload: any) => api.post('/submissions/', payload),
};

export const upload = {
  file: (formData: FormData) => api.post('/files/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default api;

