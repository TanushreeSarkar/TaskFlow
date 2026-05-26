import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Priority: explicit env vars > same-origin fallback (monolith) > localhost (dev)
const baseURL = import.meta.env.VITE_API_URL
  || import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.PROD ? (window.location.origin + '/api') : 'http://localhost:5000/api');

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_BASE_URL) {
  console.warn('[TaskFlow] No VITE_API_URL configured — using same-origin fallback:', baseURL);
  console.warn('[TaskFlow] If the backend is on a different domain, set VITE_API_URL in .env.production and rebuild.');
}

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
