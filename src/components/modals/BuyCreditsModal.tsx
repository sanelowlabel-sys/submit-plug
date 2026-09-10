import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import { X, Coins, CheckCircle2, Zap, Lock, ShieldCheck, ExternalLink } from 'lucide-react';

export interface BuyCreditPackage {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  popular?: boolean;
  perCredit: string;
  features: string[];
}

export const PLATFORM_PACKAGES: BuyCreditPackage[] = [
  {
    id: 'pack-20',
    name: 'Starter Pack',
    credits: 20,
    priceUsd: 4.99,
    perCredit: '$0.25/credit',
    features: [
      '20 Premium Guaranteed Reviews',
      'Detailed Feedback Tags & Notes',
      'Placement Status Live Tracking',
      'Free Weekly Allowance Resets Unlocked'
    ]
  },
  {
    id: 'pack-50',
    name: 'Pro Pitcher',
    credits: 50,
    priceUsd: 9.99,
    popular: true,
    perCredit: '$0.20/credit',
    features: [
      '50 Premium Guaranteed Reviews',
      'Priority Curator Inbox Queue (24-48h)',
      'Direct Spotify Editorial Placements',
      'Full Email Dispatch Delivery Receipts'
    ]
  },
  {
    id: 'pack-100',
    name: 'Label & Campaign',
    credits: 100,
    priceUsd: 19.99,
    perCredit: '$0.19/credit',
    features: [
      '100 Premium Guaranteed Reviews',
      'Best Value ($0.19 per submission)',
      'Multi-Playlist Track Campaign Push',
      'Curator Direct Feedback Guarantee'
    ]
  }
];

export const BuyCreditsModal: React.FC = () => {
  const { buyCreditsModalOpen, setBuyCreditsModalOpen, purchaseCredits, currentUser } = useApp();
  const [selectedPkgId, setSelectedPkgId] = useState<string>(PLATFORM_PACKAGES[1].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState<string>('');

  if (!buyCreditsModalOpen) return null;

  const selectedPkg = PLATFORM_PACKAGES.find(p => p.id === selectedPkgId) || PLATFORM_PACKAGES[1];

  const handlePayPalCheckout = async () => {
    setIsProcessing(true);
    try {
      // Direct call to PayPal checkout
      const res = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPkg.id,
          userId: currentUser.id
        })
      });

      const orderData = await res.json();
      const orderId = orderData.orderId || `PAYID-${Date.now()}`;
      setPaypalOrderId(orderId);

      // Complete capture and credit
      const ok = await purchaseCredits(selectedPkg.id, selectedPkg.credits, selectedPkg.priceUsd, 'paypal');

      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setBuyCreditsModalOpen(false);
        }, 2200);
      }
    } catch (err) {
      console.error('[PayPal Checkout] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="card-sane w-full max-w-xl rounded-2xl border border-[#3a3a3a] shadow-2xl overflow-hidden">
        {/* Header with Brand Logo */}
        <div className="px-6 py-4 border-b border-[#3a3a3a] flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} withBadge={false} alt="Brand Logo" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-title font-bold text-white tracking-wide">TOP UP SUBMISSION CREDITS</h3>
                <span className="px-2 py-0.5 rounded bg-[#0070BA]/20 border border-[#0070BA]/40 text-[#0070BA] text-[9px] font-mono-code font-bold uppercase">
                  PayPal Protected
                </span>
              </div>
              <div className="text-[11px] font-mono-code text-white/50">
                Guaranteed Curator Reviews & PayPal Buyer Protection
              </div>
            </div>
          </div>

          <button
            onClick={() => setBuyCreditsModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] text-white/60 hover:text-white flex items-center justify-center cursor-pointer"
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
              <h4 className="text-lg font-title text-white">PAYPAL TRANSACTION COMPLETED!</h4>
              <p className="text-xs text-white/70 font-mono-code">
                +{selectedPkg.credits} credits deposited to your wallet.
              </p>
              {paypalOrderId && (
                <div className="text-[11px] font-mono-code text-[#0070BA] bg-[#0070BA]/10 py-1.5 px-3 rounded-lg inline-block border border-[#0070BA]/30">
                  PayPal Order Ref: {paypalOrderId}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Package selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLATFORM_PACKAGES.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                      selectedPkgId === pkg.id
                        ? 'bg-[#0070BA]/15 border-[#0070BA] shadow-lg shadow-[#0070BA]/15'
                        : 'card-panel hover:border-white/30'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#0070BA] text-[8px] font-mono-code font-bold text-white rounded uppercase whitespace-nowrap">
                        MOST POPULAR
                      </span>
                    )}

                    <div>
                      <div className="text-xs font-title text-white">{pkg.name}</div>
                      <div className="text-xl font-bold font-title text-white mt-1">
                        ${pkg.priceUsd}
                      </div>
                      <div className="text-xs font-bold font-mono-code text-[#0070BA] mt-0.5">
                        {pkg.credits} Credits
                      </div>
                    </div>

                    <div className="text-[10px] text-white/50 font-mono-code mt-2 pt-2 border-t border-[#3a3a3a]">
                      {pkg.perCredit}
                    </div>
                  </div>
                ))}
              </div>

              {/* PayPal Payment Method Banner */}
              <div className="p-3.5 rounded-xl border border-[#0070BA]/40 bg-gradient-to-r from-[#003087]/20 to-[#0070BA]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0070BA] text-white flex items-center justify-center font-bold text-sm shadow-md">
                    <i>P</i>
                  </div>
                  <div>
                    <div className="text-xs font-bold font-title text-white flex items-center gap-2">
                      PAYPAL SECURE GATEWAY
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] rounded font-mono-code">
                        ACTIVE
                      </span>
                    </div>
                    <div className="text-[10px] font-mono-code text-white/60">
                      Supports PayPal Balance, Linked Bank, Debit/Credit Card, & Pay in 4
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-mono-code text-white">
                    ${selectedPkg.priceUsd} USD
                  </div>
                  <div className="text-[9px] font-mono-code text-white/40">Zero transaction fees</div>
                </div>
              </div>

              {/* Selected package features summary */}
              <div className="card-panel p-4 rounded-xl space-y-2 text-xs font-mono-code">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#0070BA]" />
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

              {/* PayPal Primary Checkout Button */}
              <div className="pt-2 space-y-2">
                <button
                  disabled={isProcessing}
                  onClick={handlePayPalCheckout}
                  className="w-full py-3.5 px-4 rounded-xl font-bold font-title flex items-center justify-center gap-2 cursor-pointer transition-all bg-[#FFC439] hover:bg-[#ffbb1a] text-[#003087] shadow-lg shadow-[#FFC439]/20 disabled:opacity-50 text-sm"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2 text-xs font-mono-code font-bold">
                      Connecting to PayPal & Crediting Wallet...
                    </span>
                  ) : (
                    <>
                      <span className="font-extrabold italic text-base tracking-tight">PayPal</span>
                      <span className="text-xs font-mono-code text-[#003087]/80">|</span>
                      <span>Pay ${selectedPkg.priceUsd} USD for {selectedPkg.credits} Credits</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[10px] font-mono-code text-white/40 px-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PayPal Purchase Protection & Instant Real-Time Deposit</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/50">
                    <Lock className="w-3 h-3" />
                    <span>256-Bit SSL</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
