/**
 * Auth Store
 * ===========
 * Zustand store for authentication state
 */

import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  loading: true,
  error: null,
  initialized: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setInitialized: (initialized) => set({ initialized, loading: false }),
  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
