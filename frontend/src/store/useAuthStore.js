import { create } from 'zustand';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function safeStorageGetItem(key) {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`LocalStorage unavailable getting ${key}:`, error);
    return null;
  }
}

function safeStorageSetItem(key, value) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`LocalStorage unavailable setting ${key}:`, error);
  }
}

function safeStorageRemoveItem(key) {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`LocalStorage unavailable removing ${key}:`, error);
  }
}

function getStoredUser() {
  const storedUser = safeStorageGetItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    safeStorageRemoveItem('user');
    return null;
  }
}

function getStoredToken() {
  const storedToken = safeStorageGetItem('token');
  if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
    safeStorageRemoveItem('token');
    return null;
  }
  return storedToken;
}

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  login: (user, token) => {
    if (!user || !token) return;
    safeStorageSetItem('user', JSON.stringify(user));
    safeStorageSetItem('token', token);
    set({ user, token });
  },
  logout: () => {
    safeStorageRemoveItem('user');
    safeStorageRemoveItem('token');
    set({ user: null, token: null });
  }
}));
