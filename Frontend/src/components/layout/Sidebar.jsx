// src/components/layout/Sidebar.jsx
import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  PieChart,
  Layers,
  Users,
  ShieldCheck,
  Info,
  LogOut,
  X,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const Sidebar = memo(({ isOpen, onCloseSidebar, onLogout }) => {
  const user = useAuthStore((state) => state.user);

  const activeClass =
    'flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-700/40 shadow-lg shadow-cyan-950/50';
  const inactiveClass =
    'flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-slate-900/80 hover:text-cyan-300 transition';

  return (
    <aside
      class={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0a101d] border-r border-cyan-900/30 p-5 transform transition-transform duration-300 md:relative md:translate-x-0 md:bg-transparent md:border-r-0 md:p-0 md:w-60 shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div class="flex justify-between items-center mb-6 md:hidden">
        <span class="text-lg font-bold text-cyan-400">Navigation Menu</span>
        <button onClick={onCloseSidebar} class="text-gray-400 hover:text-white">
          <X class="w-6 h-6" />
        </button>
      </div>

      {/* User Summary Box */}
      <div class="mb-6 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full border border-cyan-400 bg-cyan-950 flex items-center justify-center text-cyan-300 font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-white truncate">{user?.name || 'Investor'}</p>
            <p class="text-xs text-emerald-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Verified Account
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav class="space-y-1.5">
        <NavLink to="/dashboard" class={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
          <PieChart class="w-5 h-5 text-cyan-400" />
          <span>Dashboard</span>
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink to="/admin" class={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
            <ShieldCheck class="w-5 h-5 text-purple-400" />
            <span>Admin Queue</span>
          </NavLink>
        )}

        <a href="#projects" class={inactiveClass}>
          <Layers class="w-5 h-5" />
          <span>Invested Pools</span>
        </a>
        <a href="#referrals" class={inactiveClass}>
          <Users class="w-5 h-5" />
          <span>Referral Program</span>
        </a>
      </nav>

      {/* Logout Action */}
      <div class="mt-8 pt-6 border-t border-slate-800/80">
        <button
          onClick={onLogout}
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition font-medium"
        >
          <LogOut class="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Live Yield Engine Status Box */}
      <div class="mt-8 p-4 rounded-xl neon-card hidden md:block text-xs">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400">Yield Engine:</span>
          <span class="text-emerald-400 font-bold flex items-center gap-1">
            <Activity class="w-3.5 h-3.5 animate-pulse" /> Active
          </span>
        </div>
        <p class="text-slate-400">Auto-incrementing daily profit ledger every 24h.</p>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;