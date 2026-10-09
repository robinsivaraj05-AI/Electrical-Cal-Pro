import { create } from 'zustand';
import { authApi, type AuthUser } from '../api';
import { getToken, setToken, clearToken } from '../api/client';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; company?: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(email, password);
      setToken(data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(data);
      setToken(res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    clearToken();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    set({ isLoading: true });
    try {
      const data = await authApi.me();
      set({ user: data.user, token, isAuthenticated: true, isLoading: false });
    } catch {
      clearToken();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
