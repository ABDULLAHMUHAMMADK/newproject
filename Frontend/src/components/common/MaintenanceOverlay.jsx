// src/components/common/MaintenanceOverlay.jsx
import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSystemStore } from '../../store/useSystemStore';

const MaintenanceOverlay = () => {
  const maintenanceMessage = useSystemStore((state) => state.maintenanceMessage);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060a12]/95 backdrop-blur-md">
      <div class="neon-card max-w-md w-full p-8 rounded-2xl text-center border border-cyan-500/40">
        <div class="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-400 mb-4 shadow-lg shadow-cyan-500/20">
          <ShieldAlert class="w-8 h-8" />
        </div>
        <h2 class="text-2xl font-extrabold text-white mb-2">Engine Maintenance</h2>
        <p class="text-xs text-slate-300 leading-relaxed mb-6">{maintenanceMessage}</p>
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-xs text-cyan-400 font-medium">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Scheduled Optimization in Progress
        </div>
      </div>
    </div>
  );
};

export default MaintenanceOverlay;