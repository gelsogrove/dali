import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, expiresInSeconds?: number) => void;
  refreshSession: (expiresAt: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,
      login: (user, token, expiresInSeconds = 3600) => {
        const expiresAt = Date.now() + expiresInSeconds * 1000;
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('auth_expires_at', expiresAt.toString());
        set({ user, token, expiresAt, isAuthenticated: true });
      },
      refreshSession: (expiresAt) => {
        if (!expiresAt) return;
        set((state) => {
          if (!state.token || state.expiresAt === expiresAt) {
            return state;
          }
          sessionStorage.setItem('auth_expires_at', expiresAt.toString());
          return { expiresAt };
        });
      },
      logout: () => {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_expires_at');
        set({ user: null, token: null, expiresAt: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
