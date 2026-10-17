// src/pages/AdminDashboard.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X, RefreshCw, Power } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useSystemStore } from '../store/useSystemStore';
import Navbar from '../components/layout/Navbar';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { isMaintenanceMode, setMaintenanceMode } = useSystemStore();
  const [toast, setToast] = useState('');

  // 1. Fetch system-wide liquidity & user stats
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/stats');
      return res.data.data;
    },
  });

  // 2. Fetch pending manual deposits queue
  const { data: pendingDeposits } = useQuery({
    queryKey: ['pendingDeposits'],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/deposits/pending');
      return res.data.data;
    },
  });

  // 3. Fetch pending cashout requests queue
  const { data: pendingWithdrawals } = useQuery({
    queryKey: ['pendingWithdrawals'],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/withdrawals/pending');
      return res.data.data;
    },
  });

  // Deposit Approval / Rejection Mutation
  const depositActionMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const res = await axiosInstance.put(`/admin/deposits/${id}/action`, { action });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingDeposits'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setToast(data.message);
      setTimeout(() => setToast(''), 3000);
    },
  });

  // Withdrawal Approval / Rejection Mutation
  const withdrawalActionMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const res = await axiosInstance.put(`/admin/withdrawals/${id}/action`, { action });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setToast(data.message);
      setTimeout(() => setToast(''), 3000);
    },
  });

  return (
    <div class="min-h-screen bg-[#060a12] text-slate-100 pb-12">
      <Navbar onMobileSidebarToggle={() => {}} onOpenNotifications={() => {}} />

      <div class="max-w-7xl mx-auto px-4 py-8 md:px-8">
        {/* Header & Maintenance Mode Toggle */}
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 class="text-2xl font-extrabold text-white flex items-center gap-2">
              <ShieldCheck class="w-7 h-7 text-purple-400" /> Admin Control Center
            </h1>
            <p class="text-xs text-slate-400 mt-1">Review pending manual deposits, process cashouts, & toggle system flags.</p>
          </div>

          <button
            onClick={() => setMaintenanceMode(!isMaintenanceMode)}
            class={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
              isMaintenanceMode
                ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Power class="w-4 h-4" />
            <span>{isMaintenanceMode ? 'Maintenance Mode: ACTIVE' : 'Toggle Maintenance Mode'}</span>
          </button>
        </div>

        {/* System Stats Overview Grid */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="neon-card p-5 rounded-2xl">
            <span class="text-xs font-semibold text-slate-400">Total Registered Users</span>
            <div class="text-2xl font-extrabold text-white mt-1">{stats?.totalUsers || 0}</div>
          </div>
          <div class="neon-card p-5 rounded-2xl">
            <span class="text-xs font-semibold text-slate-400">Total System Liquidity</span>
            <div class="text-2xl font-extrabold text-cyan-400 mt-1">${stats?.totalLiquidity?.toFixed(2) || '0.00'}</div>
          </div>
          <div class="neon-card p-5 rounded-2xl">
            <span class="text-xs font-semibold text-slate-400">Pending Deposits Queue</span>
            <div class="text-2xl font-extrabold text-amber-400 mt-1">{stats?.pendingDepositsCount || 0}</div>
          </div>
          <div class="neon-card p-5 rounded-2xl">
            <span class="text-xs font-semibold text-slate-400">Pending Cashouts Queue</span>
            <div class="text-2xl font-extrabold text-purple-400 mt-1">{stats?.pendingWithdrawalsCount || 0}</div>
          </div>
        </div>

        {/* Pending Manual Deposits Review Queue */}
        <div class="neon-card p-6 rounded-2xl mb-8">
          <h3 class="text-base font-bold text-white mb-4">Pending Manual Deposits (TxID Submissions)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400">
                  <th class="py-3 px-3">Investor Email</th>
                  <th class="py-3 px-3">Transaction TxID</th>
                  <th class="py-3 px-3">Amount</th>
                  <th class="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                {pendingDeposits?.length === 0 ? (
                  <tr>
                    <td colSpan={4} class="py-4 text-center text-slate-500">No pending deposit requests.</td>
                  </tr>
                ) : (
                  pendingDeposits?.map((dep) => (
                    <tr key={dep._id}>
                      <td class="py-3 px-3 font-semibold text-white">{dep.user?.email}</td>
                      <td class="py-3 px-3 font-mono text-cyan-300">{dep.txHash}</td>
                      <td class="py-3 px-3 font-bold text-emerald-400">${dep.amount} USDT</td>
                      <td class="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => depositActionMutation.mutate({ id: dep._id, action: 'APPROVE' })}
                          class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => depositActionMutation.mutate({ id: dep._id, action: 'REJECT' })}
                          class="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;