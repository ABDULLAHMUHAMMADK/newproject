// src/store/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: localStorage.getItem('token') || null,
      role: null,
      isAuthenticated: !!localStorage.getItem('token'),

      // Set user session after login or registration
      setAuth: ({ user, token }) => {
        localStorage.setItem('token', token);
        set({
          user,
          token,
          role: user?.role || 'user',
          isAuthenticated: true,
        });
      },

      // Update cached user or wallet details dynamically
      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      // Logout and purge credentials
      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'tradeyield-auth-storage', // Key name in localStorage
    }
  )
);