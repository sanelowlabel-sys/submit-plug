import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import { X, Coins, CheckCircle2, Zap, Lock, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

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
      '48-Hour SLA Guarantee'
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
      'Priority Curator Inbox Queue',
      'Full Email Dispatch Delivery Receipts',
      '48-Hour SLA Guarantee'
    ]
  },
  {
    id: 'pack-100',
    name: 'Label & Campaign',
    credits: 100,
    priceUsd: 19.99,
    perCredit: '$0.20/credit',
    features: [
      '100 Premium Guaranteed Reviews',
      'Multi-Playlist Track Campaign Push',
      'Curator Direct Feedback Guarantee',
      '48-Hour SLA Guarantee'
    ]
  }
];

export const BuyCreditsModal: React.FC = () => {
  const { buyCreditsModalOpen, setBuyCreditsModalOpen, purchaseCredits, currentUser, showToast } = useApp();
  const [selectedPkgId, setSelectedPkgId] = useState<string>(PLATFORM_PACKAGES[1].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paypalApproveUrl, setPaypalApproveUrl] = useState<string | null>(null);

  if (!buyCreditsModalOpen) return null;

  const selectedPkg = PLATFORM_PACKAGES.find(p => p.id === selectedPkgId) || PLATFORM_PACKAGES[1];

  const handlePayPalCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setPaypalApproveUrl(null);

    const result = await purchaseCredits(selectedPkg.id);

    if (result.success && result.approveUrl) {
      setPaypalApproveUrl(result.approveUrl);
      // Attempt to open in a new tab for seamless PayPal payment
      window.open(result.approveUrl, '_blank', 'noopener,noreferrer');
      showToast('PayPal Window Opened', 'Please complete payment in the PayPal tab.', 'info');
    } else if (!result.success) {
      setErrorMessage(result.error || 'Failed to initialize PayPal order. Check server configuration.');
    }

    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="glass-panel w-full max-w-xl rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 relative overflow-hidden bg-surface/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backlight */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-spotify-green/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <button
          onClick={() => setBuyCreditsModalOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-1">
            <div className="w-12 h-12 rounded-2xl bg-spotify-green/20 text-spotify-green flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display tracking-wider text-white">
            TOP UP PITCH CREDITS
          </h3>
          <p className="text-xs text-white/60 font-sans max-w-md mx-auto">
            Fixed server-side pricing. Credits are recorded on an immutable ledger and compensated strictly for curator review time.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-sans flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {paypalApproveUrl && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-sans space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>PayPal Checkout Session Ready</span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              If the PayPal window did not open automatically, please click below to complete your payment:
            </p>
            <a
              href={paypalApproveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs"
            >
              <span>Proceed to PayPal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Package Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {PLATFORM_PACKAGES.map((pkg) => {
            const isSelected = selectedPkgId === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-spotify-green/10 border-spotify-green shadow-lg shadow-spotify-green/15 scale-[1.02]'
                    : 'bg-black/30 border-white/10 hover:border-white/20'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-spotify-green text-black font-mono font-bold text-[9px] uppercase tracking-wider shadow">
                    Most Popular
                  </span>
                )}
                <div>
                  <div className="text-xs font-bold text-white font-display mb-1">{pkg.name}</div>
                  <div className="text-2xl font-black font-display text-spotify-green tracking-tight">
                    {pkg.credits} <span className="text-xs font-mono font-normal text-white/50">credits</span>
                  </div>
                  <div className="text-[11px] text-white/40 font-mono mt-0.5">{pkg.perCredit}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-base font-bold font-display text-white">${pkg.priceUsd.toFixed(2)}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-spotify-green bg-spotify-green text-black' : 'border-white/30'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Included Features */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 mb-6 space-y-2">
          <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1">
            Package Inclusions ({selectedPkg.name})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-white/80">
            {selectedPkg.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-spotify-green flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handlePayPalCheckout}
          disabled={isProcessing}
          className="w-full py-4 bg-[#0070BA] hover:bg-[#005ea6] text-white font-display font-bold text-sm tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="animate-pulse">COMMUNICATING WITH PAYPAL SERVER...</span>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>PAY ${selectedPkg.priceUsd.toFixed(2)} WITH PAYPAL</span>
            </>
          )}
        </button>

        <div className="mt-3 text-center flex items-center justify-center gap-4 text-[11px] text-white/40 font-sans">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-spotify-green" />
            100% Anti-Payola Compliant
          </span>
          <span>•</span>
          <span>48h SLA Guarantee</span>
        </div>
      </div>
    </div>
  );
};
