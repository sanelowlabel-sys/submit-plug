import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, ShieldCheck, FileText, Lock, RotateCcw } from 'lucide-react';

export const LegalPagesModal: React.FC = () => {
  const { legalModalOpen, setLegalModalOpen, legalModalTab, openLegalModal } = useApp();

  if (!legalModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="glass-panel w-full max-w-3xl rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 relative overflow-hidden bg-surface/95 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-spotify-green/20 text-spotify-green">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold font-display text-white">PLAYLIST PLUG POLICIES</h3>
              <p className="text-xs text-white/50 font-sans">
                Terms of Service, Privacy Governance, and 48-Hour SLA Refund Policy
              </p>
            </div>
          </div>
          <button
            onClick={() => setLegalModalOpen(false)}
            className="text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl bg-black/40 p-1 border border-white/10 my-4 flex-shrink-0">
          <button
            onClick={() => openLegalModal('terms')}
            className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              legalModalTab === 'terms'
                ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>TERMS OF SERVICE</span>
          </button>

          <button
            onClick={() => openLegalModal('privacy')}
            className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              legalModalTab === 'privacy'
                ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>PRIVACY POLICY</span>
          </button>

          <button
            onClick={() => openLegalModal('refund')}
            className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              legalModalTab === 'refund'
                ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>REFUND GUARANTEE</span>
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs text-white/75 font-sans leading-relaxed">
          {legalModalTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white font-display">1. Organic Submission & Anti-Payola Compliance</h4>
              <p>
                Playlist Plug connects artists directly with independent Spotify playlist curators. In full compliance with Spotify Platform Rules and commercial guidelines, credits and submission fees compensate curators solely for their time, expert editorial review, and constructive feedback. <strong>Playlist placement can never be bought, guaranteed, or sold.</strong> Curators retain complete, unilateral editorial discretion to decline tracks that do not fit their playlist sonic profile.
              </p>

              <h4 className="text-sm font-bold text-white font-display">2. Account Responsibility & Verification</h4>
              <p>
                Curators must verify ownership of any submitted Spotify playlist by demonstrating editorial control through our one-time verification code system or admin authorization. The creation of automated bot playlists or artificial streaming generation is strictly prohibited and results in immediate permanent termination.
              </p>

              <h4 className="text-sm font-bold text-white font-display">3. Submission Standards</h4>
              <p>
                Artists may only submit musical works for which they own or hold licensed distribution rights. Any submission containing copyright infringement, defamatory content, or unauthorized impersonation will be removed without credit refund.
              </p>
            </div>
          )}

          {legalModalTab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white font-display">1. Data Collection & Authentication</h4>
              <p>
                Playlist Plug utilizes Supabase Auth for industry-standard encrypted email authentication and session management. We only collect the minimal information necessary to deliver platform services: your email address, chosen artist/curator display name, and public Spotify playlist or track links you choose to submit.
              </p>

              <h4 className="text-sm font-bold text-white font-display">2. Row Level Security & Encryption</h4>
              <p>
                All stored profile, transaction, and pitch data is protected by PostgreSQL Row Level Security (RLS) policies. Only you and authorized playlist curators evaluating your submissions can view private pitch notes. Financial transaction details and payment tokens are processed directly through PayPal and never stored on our database servers.
              </p>

              <h4 className="text-sm font-bold text-white font-display">3. Right to Erasure (Account Deletion)</h4>
              <p>
                You may permanently delete your account at any time via your Profile Settings. Account deletion immediately cascades and purges your profile, associated pitch records, and playlist listings from our live databases.
              </p>
            </div>
          )}

          {legalModalTab === 'refund' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white font-display">1. 48-Hour Review SLA Guarantee</h4>
              <p>
                When submitting a premium pitch with credits, the recipient curator is held to a strict 48-hour response Service Level Agreement (SLA). If a curator fails to listen to your track and provide editorial feedback within 48 hours, <strong>100% of your spent credits are automatically eligible for an instant refund</strong>.
              </p>

              <h4 className="text-sm font-bold text-white font-display">2. Automatic Ledger Credits</h4>
              <p>
                Refunded credits are immediately restored to your available wallet balance via an immutable ledger transaction. You may reuse refunded credits toward any other verified playlist on the marketplace.
              </p>

              <h4 className="text-sm font-bold text-white font-display">3. PayPal Purchase Inquiries</h4>
              <p>
                Unused purchased credit bundles may be refunded back to the original PayPal payment method within 14 days of purchase by contacting administrative support, provided the credits have not been consumed on completed reviews.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-white/10 flex justify-end flex-shrink-0">
          <button
            onClick={() => setLegalModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
