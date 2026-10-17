// src/store/useSystemStore.js
import { create } from 'zustand';

export const useSystemStore = create((set) => ({
  isMaintenanceMode: false,
  maintenanceMessage: 'System is undergoing scheduled engine maintenance. Please check back shortly.',
  featureFlags: {
    depositsEnabled: true,
    withdrawalsEnabled: true,
    referralBonusEnabled: true,
  },

  // Toggle maintenance mode globally
  setMaintenanceMode: (status, message) =>
    set({
      isMaintenanceMode: status,
      maintenanceMessage: message || 'System is undergoing scheduled engine maintenance.',
    }),

  // Toggle specific feature flags
  setFeatureFlag: (flag, status) =>
    set((state) => ({
      featureFlags: { ...state.featureFlags, [flag]: status },
    })),
}));