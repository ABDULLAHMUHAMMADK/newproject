// src/components/modals/DepositModal.jsx
import React, { useState } from 'react';
import { X, QrCode, Copy, Check, ArrowRight, ShieldAlert, CreditCard } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';

const DepositModal = ({ isOpen, onClose, onShowToast }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('binance'); // 'binance' or 'manual'
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [binanceCheckout, setBinanceCheckout] = useState(null);
  const [error, setError] = useState('');

  // Fetch dynamic top-up constraints for logged-in user
  const { data: topUpInfo, isLoading: loadingTopUp } = useQuery({
    queryKey: ['topUpInfo'],
    queryFn: async () => {
      const res = await axiosInstance.get('/wallet/topup-info');
      return res.data.data;
    },
    enabled: isOpen, // Fetch only when modal is open
  });

  // Manual Deposit Mutation
  const manualDepositMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post('/deposits/manual', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onShowToast('Manual deposit proof submitted! Awaiting admin review.');
      handleClose();
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to submit manual deposit proof.');
    },
  });

  // Binance Pay Order Mutation
  const binanceOrderMutation = useMutation({
    mutationFn: async (depositAmount) => {
      const res = await axiosInstance.post('/deposits/binance-order', { amount: parseFloat(depositAmount) });
      return res.data.data;
    },
    onSuccess: (data) => {
      setBinanceCheckout(data);
      onShowToast('Binance Pay order generated successfully!');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to initiate Binance Pay order.');
    },
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setError('');
    const minRequired = topUpInfo?.minRequiredDeposit || 300;

    if (parseFloat(amount) < minRequired) {
      setError(`Minimum deposit required for your account is $${minRequired} USDT.`);
      return;
    }

    manualDepositMutation.mutate({ amount: parseFloat(amount), txHash });
  };

  const handleBinanceOrderSubmit = (e) => {
    e.preventDefault();
    setError('');
    const minRequired = topUpInfo?.minRequiredDeposit || 300;

    if (parseFloat(amount) < minRequired) {
      setError(`Minimum deposit required for your account is $${minRequired} USDT.`);
      return;
    }

    binanceOrderMutation.mutate(amount);
  };

  const handleClose = () => {
    setAmount('');
    setTxHash('');
    setBinanceCheckout(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const minRequired = topUpInfo?.minRequiredDeposit || 300;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="neon-card bg-[#0b1322] max-w-md w-full p-6 rounded-2xl relative border border-cyan-500/40 shadow-2xl">
        <button onClick={handleClose} class="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <QrCode class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Deposit USDT</h3>
            <p class="text-xs text-slate-400">Transfer from Binance or external wallet.</p>
          </div>
        </div>

        {/* Dynamic Top-Up Requirement Alert Box */}
        {loadingTopUp ? (
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center mb-4">
            Calculating account deposit threshold...
          </div>
        ) : (
          <div class="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800 text-xs mb-4 flex justify-between items-center">
            <span class="text-slate-300">Minimum Required Top-Up:</span>
            <span class="font-extrabold text-cyan-400 text-sm">${minRequired} USDT</span>
          </div>
        )}

        {/* Error Message Alert */}
        {error && (
          <div class="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert class="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Method Selector Tabs */}
        <div class="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => { setActiveTab('binance'); setError(''); }}
            class={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'binance'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <CreditCard class="w-4 h-4" />
            <span>Binance Pay (API)</span>
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setError(''); }}
            class={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <QrCode class="w-4 h-4" />
            <span>Manual TxID Fallback</span>
          </button>
        </div>

        {/* Tab 1: Binance Pay Checkout */}
        {activeTab === 'binance' && (
          <div>
            {!binanceCheckout ? (
              <form onSubmit={handleBinanceOrderSubmit} class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">Deposit Amount (USDT)</label>
                  <input
                    type="number"
                    min={minRequired}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`e.g. ${minRequired}`}
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={binanceOrderMutation.isPending}
                  class="w-full btn-neon-primary py-3 rounded-xl font-bold text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {binanceOrderMutation.isPending ? (
                    <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>Generate Binance QR Code</span>
                      <ArrowRight class="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                <p class="text-xs text-cyan-400 font-semibold">Scan QR with Binance App</p>
                <div class="bg-white p-2 w-36 h-36 mx-auto rounded-xl shadow-md flex items-center justify-center">
                  <img src={binanceCheckout.qrcodeLink} alt="Binance QR" class="w-full h-full object-contain" />
                </div>
                <a
                  href={binanceCheckout.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-block w-full btn-neon-primary py-2.5 rounded-xl font-bold text-xs"
                >
                  Open Binance Checkout Page
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manual TxID Fallback */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} class="space-y-3">
            <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center mb-3">
              <p class="text-[11px] text-cyan-400 font-semibold mb-1">Platform Binance USDT Receive Address (TRC-20)</p>
              <div class="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span class="text-[11px] font-mono text-slate-300 truncate">TY82aN81mXpZkLqW902MvPqX2104</span>
                <button
                  type="button"
                  onClick={() => handleCopy('TY82aN81mXpZkLqW902MvPqX2104')}
                  class="text-xs text-cyan-400 hover:text-white shrink-0 font-bold flex items-center gap-1"
                >
                  {copied ? <Check class="w-3.5 h-3.5 text-emerald-400" /> : <Copy class="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Deposit Amount (USDT)</label>
              <input
                type="number"
                min={minRequired}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`e.g. ${minRequired}`}
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Transaction Hash (TxID)</label>
              <input
                type="text"
                required
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste transaction hash or Order ID"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={manualDepositMutation.isPending}
              class="w-full btn-neon-primary py-3 rounded-xl font-bold text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {manualDepositMutation.isPending ? (
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span>Submit Verification Proof</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DepositModal;