import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('atomquest_token'),
  user: JSON.parse(localStorage.getItem('atomquest_user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('atomquest_token', token);
    localStorage.setItem('atomquest_user', JSON.stringify(user));
    set({ token, user });
  },
  clearAuth: () => {
    localStorage.removeItem('atomquest_token');
    localStorage.removeItem('atomquest_user');
    set({ token: null, user: null });
  },
  isAuthenticated: () => !!get().token,
}));
