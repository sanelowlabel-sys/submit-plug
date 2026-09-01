import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CREDIT_PACKAGES } from '../../data/mockData';
import { X, Coins, CheckCircle2, ShieldCheck, Zap, Lock, CreditCard } from 'lucide-react';

export const BuyCreditsModal: React.FC = () => {
  const { buyCreditsModalOpen, setBuyCreditsModalOpen, purchaseCredits } = useApp();
  const [selectedPkgId, setSelectedPkgId] = useState<string>(CREDIT_PACKAGES[1].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!buyCreditsModalOpen) return null;

  const selectedPkg = CREDIT_PACKAGES.find(p => p.id === selectedPkgId) || CREDIT_PACKAGES[1];

  const handlePurchase = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    await purchaseCredits(selectedPkg.id, selectedPkg.credits, selectedPkg.priceUsd);
    setIsProcessing(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setBuyCreditsModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="card-sane w-full max-w-xl rounded-2xl border border-[#3a3a3a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3a3a3a] flex items-center justify-between bg-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#BE1E2F] flex items-center justify-center text-white">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-title text-white">TOP UP SUBMIT PLUG CREDITS</h3>
              <div className="text-[11px] font-mono-code text-white/50">
                Guaranteed 48h Curator Reviews & Detailed Placement Feedback
              </div>
            </div>
          </div>

          <button
            onClick={() => setBuyCreditsModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] text-white/60 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-title text-white">CREDITS DEPOSITED!</h4>
              <p className="text-xs text-white/70 font-mono-code">
                +{selectedPkg.credits} credits have been added to your Submit Plug wallet.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CREDIT_PACKAGES.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                      selectedPkgId === pkg.id
                        ? 'bg-[#BE1E2F]/15 border-[#BE1E2F] shadow-lg shadow-[#BE1E2F]/15'
                        : 'card-panel hover:border-white/30'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#BE1E2F] text-[8px] font-mono-code font-bold text-white rounded uppercase whitespace-nowrap">
                        BEST VALUE
                      </span>
                    )}

                    <div>
                      <div className="text-xs font-title text-white">{pkg.name}</div>
                      <div className="text-xl font-bold font-title text-white mt-1">
                        ${pkg.priceUsd}
                      </div>
                      <div className="text-xs font-bold font-mono-code text-[#BE1E2F] mt-0.5">
                        {pkg.credits} Credits
                      </div>
                    </div>

                    <div className="text-[10px] text-white/50 font-mono-code mt-2 pt-2 border-t border-[#3a3a3a]">
                      ${(pkg.priceUsd / pkg.credits).toFixed(2)} / pitch
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected package features summary */}
              <div className="card-panel p-4 rounded-xl space-y-2 text-xs font-mono-code">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#BE1E2F]" />
                  PACKAGE PERKS INCLUDED:
                </div>
                <ul className="space-y-1 text-white/70 text-[11px]">
                  {selectedPkg.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stripe Payment Simulator Button */}
              <div className="pt-2">
                <button
                  disabled={isProcessing}
                  onClick={handlePurchase}
                  className="btn-sane w-full py-3.5 rounded-xl text-xs font-bold font-title flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#BE1E2F]/25 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {isProcessing
                    ? 'Processing Secure Stripe Checkout...'
                    : `Pay $${selectedPkg.priceUsd} USD with Stripe`}
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono-code text-white/40 mt-2">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-Bit SSL Encrypted • Powered by Stripe & Spotify Web API</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
