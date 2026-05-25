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

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token') || null,
  login: (user, token) => {
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
