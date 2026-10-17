// src/components/layout/BottomNav.jsx
import React, { memo } from 'react';
import { Home, BarChart2, Plus, Users, User } from 'lucide-react';

const BottomNav = memo(({ onOpenDeposit }) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-[#070c16]/95 border-t border-cyan-900/40 py-2 px-4 md:hidden backdrop-blur-lg">
      <div className="flex justify-around items-center text-center">
        <a href="#" className="text-cyan-400 flex flex-col items-center gap-1 text-[10px] font-semibold">
          <Home className="w-5 h-5" />
          <span>Home</span>
        </a>
        <a href="#projects" className="text-slate-400 hover:text-cyan-400 flex flex-col items-center gap-1 text-[10px]">
          <BarChart2 className="w-5 h-5" />
          <span>Pools</span>
        </a>
        <button
          onClick={onOpenDeposit}
          className="bg-gradient-to-tr from-cyan-600 to-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40 -mt-5 border-2 border-slate-900 transition hover:scale-105"
        >
          <Plus className="w-6 h-6" />
        </button>
        <a href="#referrals" className="text-slate-400 hover:text-cyan-400 flex flex-col items-center gap-1 text-[10px]">
          <Users className="w-5 h-5" />
          <span>Referral</span>
        </a>
        <a href="#profile" className="text-slate-400 hover:text-cyan-400 flex flex-col items-center gap-1 text-[10px]">
          <User className="w-5 h-5" />
          <span>Profile</span>
        </a>
      </div>
    </div>
  );
});

BottomNav.displayName = 'BottomNav';
export default BottomNav;