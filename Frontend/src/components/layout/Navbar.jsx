// src/components/layout/Navbar.jsx
import React, { memo } from 'react';
import { TrendingUp, Bell, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const Navbar = memo(({ onMobileSidebarToggle, onOpenNotifications }) => {
  const user = useAuthStore((state) => state.user);

  return (
    <header class="sticky top-0 z-30 bg-[#070c16]/90 backdrop-blur-md border-b border-cyan-900/30 px-4 py-3 md:px-8">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left Branding & Mobile Toggle */}
        <div class="flex items-center gap-3">
          <button
            onClick={onMobileSidebarToggle}
            class="md:hidden text-gray-300 hover:text-cyan-400 focus:outline-none p-2 rounded-lg bg-gray-900/50"
          >
            <Menu class="w-5 h-5" />
          </button>
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <TrendingUp class="w-5 h-5 text-white" />
            </div>
            <div>
              <span class="text-xl font-extrabold tracking-wide text-white">
                Trade<span class="text-cyan-400">Yield</span>
              </span>
              <span class="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Pro V2.4
              </span>
            </div>
          </div>
        </div>

        {/* Right User Info & Quick Alerts */}
        <div class="flex items-center gap-4">
          <button
            onClick={onOpenNotifications}
            class="relative p-2 rounded-xl bg-slate-900/80 text-gray-300 hover:text-cyan-400 border border-slate-800 transition"
          >
            <Bell class="w-5 h-5" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          </button>

          <div class="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div class="relative">
              <div class="w-10 h-10 rounded-full border-2 border-cyan-400 bg-slate-800 flex items-center justify-center text-cyan-300 font-bold text-sm shadow-md shadow-cyan-500/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
            </div>
            <div class="hidden sm:block">
              <h4 class="text-sm font-semibold text-white leading-none">{user?.name || 'Investor'}</h4>
              <span class="text-xs text-cyan-400 font-medium">
                {user?.role === 'admin' ? 'System Administrator' : 'VIP Investor'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';
export default Navbar;