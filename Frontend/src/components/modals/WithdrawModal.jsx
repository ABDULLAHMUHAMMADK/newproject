// src/components/modals/WithdrawModal.jsx
import React, { useState } from 'react';
import { X, ArrowRight, ShieldAlert, AlertTriangle, Lock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';

const WithdrawModal = ({ isOpen, onClose, onShowToast }) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [binancePayId, setBinancePayId] = useState('');
  const [error, setError] = useState('');

  // Query live withdrawal eligibility & grace period status
  const { data: withdrawInfo, isLoading } = useQuery({
    queryKey: ['withdrawInfo'],
    queryFn: async () => {
      const res = await axiosInstance.get('/wallet/withdraw-info');
      return res.data.data;
    },
    enabled: isOpen,
  });

  // Cashout Mutation
  const withdrawMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post('/withdrawals/request', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onShowToast('Withdrawal request dispatched to admin payout queue!');
      handleClose();
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to submit withdrawal request.');
    },
  });

  const handleClose = () => {
    setAmount('');
    setBinancePayId('');
    setError('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const requestedAmount = parseFloat(amount);
    const totalAvailable =
      (withdrawInfo?.mainBalance || 0) +
      (withdrawInfo?.profitBalance || 0) +
      (withdrawInfo?.referralBalance || 0);

    if (requestedAmount > totalAvailable) {
      setError(`Insufficient available balance. Total available: $${totalAvailable.toFixed(2)} USDT.`);
      return;
    }

    withdrawMutation.mutate({ amount: requestedAmount, binancePayId });
  };

  if (!isOpen) return null;

  const rules = withdrawInfo?.withdrawalRules;
  const totalAvailable =
    (withdrawInfo?.mainBalance || 0) +
    (withdrawInfo?.profitBalance || 0) +
    (withdrawInfo?.referralBalance || 0);

  // Dynamic fee calculation (20% fee preview)
  const requestedVal = parseFloat(amount) || 0;
  const platformFee = requestedVal * 0.2; // 20%
  const netPayout = requestedVal - platformFee;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="neon-card bg-[#0b1322] max-w-md w-full p-6 rounded-2xl relative border border-cyan-500/40 shadow-2xl">
        <button onClick={handleClose} class="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Lock class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Withdraw Funds</h3>
            <p class="text-xs text-slate-400">Cashout directly to your Binance wallet.</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div class="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert class="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div class="p-6 text-center text-xs text-slate-400">Loading withdrawal rules...</div>
        ) : !rules?.canWithdraw ? (
          /* Locked Status View */
          <div class="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-center space-y-3">
            <AlertTriangle class="w-8 h-8 text-amber-400 mx-auto" />
            <h4 class="text-sm font-bold text-white">Withdrawal Locked</h4>
            <p class="text-xs text-slate-300 leading-relaxed">
              Your 24-hour initial grace period has expired. You must accumulate at least{' '}
              <strong class="text-amber-300">$50.00 USDT</strong> in unwithdrawn daily profit to unlock cashouts.
            </p>
            <div class="p-2 bg-slate-900 rounded-lg text-xs font-mono text-cyan-400 border border-slate-800">
              Current Unwithdrawn Profit: ${withdrawInfo?.unwithdrawnProfitCounter?.toFixed(2) || '0.00'} USDT
            </div>
          </div>
        ) : (
          /* Active Withdrawal Form */
          <form onSubmit={handleSubmit} class="space-y-3">
            <div class="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
              <span class="text-slate-400">Total Available Balance:</span>
              <span class="font-extrabold text-cyan-300 text-sm">${totalAvailable.toFixed(2)} USDT</span>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Withdrawal Amount (USDT)</label>
              <input
                type="number"
                min="10"
                max={totalAvailable}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Binance Pay ID / TRC20 Address</label>
              <input
                type="text"
                required
                value={binancePayId}
                onChange={(e) => setBinancePayId(e.target.value)}
                placeholder="Enter Binance Pay ID or address"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* 20% Platform Fee Live Breakdown Box */}
            {requestedVal > 0 && (
              <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div class="flex justify-between text-slate-400">
                  <span>Requested Amount:</span>
                  <span class="text-white">${requestedVal.toFixed(2)} USDT</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>Platform Deduction (20%):</span>
                  <span class="text-rose-400">-${platformFee.toFixed(2)} USDT</span>
                </div>
                <div class="flex justify-between font-bold text-cyan-300 pt-1.5 border-t border-slate-800">
                  <span>Net Estimated Payout:</span>
                  <span class="text-emerald-400 text-sm">${netPayout.toFixed(2)} USDT</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              class="w-full btn-neon-primary py-3 rounded-xl font-bold text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {withdrawMutation.isPending ? (
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Submit Payout Request</span>
                  <ArrowRight class="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;