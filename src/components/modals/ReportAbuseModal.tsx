import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ReportAbuseModal: React.FC = () => {
  const { reportModalOpen, setReportModalOpen, reportTarget, submitAbuseReport, isAuthenticated, openLoginModal } = useApp();

  const [reason, setReason] = useState('Inactivity / Unresponsive Curator');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!reportModalOpen || !reportTarget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    setIsSubmitting(true);
    await submitAbuseReport(reason, details);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="glass-panel w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 relative overflow-hidden bg-surface/95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setReportModalOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white">REPORT CONTENT / CURATOR</h3>
            <p className="text-xs text-white/50 font-sans">
              Help keep Playlist Plug organic, safe, and compliant.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/5 mb-4 text-xs font-sans text-white/80">
          Target: <strong className="text-white font-display">{reportTarget.title}</strong>
          <span className="block text-[11px] text-white/40 font-mono mt-0.5">Type: {reportTarget.type}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-sans text-white/70 mb-1">
              REASON FOR REPORT
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-spotify-green font-sans"
            >
              <option value="Inactivity / Unresponsive Curator">Inactivity / Unresponsive Curator</option>
              <option value="Bot Traffic / Fake Followers">Suspicious Bot Activity or Fake Followers</option>
              <option value="Payola / Paid Placement Request">Asking for Paid Placement Outside Credits (Anti-Payola)</option>
              <option value="Copyright or Impersonation">Copyright Infringement or Impersonation</option>
              <option value="Harassment or Offensive Content">Offensive Feedback or Harassment</option>
              <option value="Other Policy Violation">Other Policy Violation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-sans text-white/70 mb-1">
              EXPLANATION & EVIDENCE
            </label>
            <textarea
              rows={3}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide context or specific playlist links to assist our review..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
