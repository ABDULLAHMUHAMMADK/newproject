// Frontend/src/api/axiosInstance.js
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Live Vercel API production fallback URL
const PRODUCTION_API_URL = 'https://newproject-eight-ashy.vercel.app/api';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || PRODUCTION_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Attach JWT Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Filter 401s on Auth Routes
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const requestUrl = error.config ? error.config.url : '';

    // Ignore 401 redirect for login/register endpoints so inline form errors display correctly
    const isAuthRoute = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (status === 401 && !isAuthRoute) {
      useAuthStore.getState().logout();
      window.location.href = '/login?expired=true';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;