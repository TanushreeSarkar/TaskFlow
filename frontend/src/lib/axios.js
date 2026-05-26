import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// In production, the backend serves the frontend, so we use relative path.
// In development, we use localhost or provided env var.
const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL,
});

// Request interceptor — attach token from Zustand store to every request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { token, logout } = useAuthStore.getState();
      // Only auto-logout if we had a token (i.e. not on the login page itself)
      if (token) {
        logout();
        // Use hash-based navigation to match HashRouter
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
