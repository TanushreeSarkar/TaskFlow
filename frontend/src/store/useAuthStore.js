import { create } from 'zustand';

function getStoredUser() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem('user');
    return null;
  }
}

function getStoredToken() {
  const storedToken = localStorage.getItem('token');
  if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
    localStorage.removeItem('token');
    return null;
  }
  return storedToken;
}

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  login: (user, token) => {
    if (!user || !token) return;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));
