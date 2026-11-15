import axios, { AxiosError, AxiosResponse } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach JWT Bearer token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sterling_connect_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isPublicPath = [
        '/signin',
        '/sign-in',
        '/reset-password',
        '/register',
        '/verify-email',
        '/',
        '/opportunities',
      ].some((p) => currentPath === p || (p !== '/' && currentPath.startsWith(p)));
      if (!isPublicPath) {
        localStorage.removeItem('sterling_connect_token');
        localStorage.removeItem('sterling_connect_user');
        window.location.href = '/sign-in?expired=true';
      }
    }
    return Promise.reject(error);
  }
);
