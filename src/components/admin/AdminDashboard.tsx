import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  Copy,
  Check,
  Database,
  Radio,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    adminMetrics,
    pendingPlaylists,
    abuseReports,
    fetchAdminData,
    approveCuratorPlaylist,
    rejectCuratorPlaylist,
    resolveAbuseReport,
    refundSubmissionCredits,
    exportDatabaseBackup,
    submissions,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'reports' | 'refunds' | 'sql'>('pending');
  const [refundSubId, setRefundSubId] = useState('');
  const [refundReason, setRefundReason] = useState('Curator 48h SLA response guarantee exceeded');
  const [isRefunding, setIsRefunding] = useState(false);
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    fetchAdminData();
    // Load migration SQL schema
    fetch('/api/supabase/schema')
      .then(res => res.json())
      .then(data => setSqlSchema(data.schema || ''))
      .catch(() => {});
  }, [fetchAdminData]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-white">ADMINISTRATOR ACCESS REQUIRED</h2>
        <p className="text-xs text-white/60 max-w-md mx-auto">
          Your current account does not have administrator privileges. Only system administrators can inspect moderation queues, approve curators, and execute credit refunds.
        </p>
      </div>
    );
  }

  const handleCopySql = () => {
    if (!sqlSchema) return;
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    showToast('Copied', 'SQL Migration & RLS policies copied to clipboard.', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundSubId.trim()) return;
    setIsRefunding(true);
    const ok = await refundSubmissionCredits(refundSubId.trim(), refundReason.trim());
    if (ok) {
      setRefundSubId('');
    }
    setIsRefunding(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-surface/90">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-spotify-green/20 text-spotify-green">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold font-display tracking-tight text-white">
                  PLATFORM ADMINISTRATION
                </h1>
                <p className="text-xs text-white/60 font-sans">
                  Curator approval queue, abuse moderation, atomic credit refunds, and database backups.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => exportDatabaseBackup()}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-spotify-green" />
              <span>Export Database Backup</span>
            </button>
            <button
              onClick={() => handleCopySql()}
              className="px-4 py-2.5 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>Copy SQL Migration</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-white/50 font-sans">Active Playlists</div>
            <div className="text-2xl font-bold font-display text-white mt-1">
              {adminMetrics?.activePlaylists ?? 0}
            </div>
          </div>
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-white/50 font-sans">Pending Curator Approvals</div>
            <div className="text-2xl font-bold font-display text-amber-400 mt-1">
              {pendingPlaylists.length}
            </div>
          </div>
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-white/50 font-sans">Open Abuse Reports</div>
            <div className="text-2xl font-bold font-display text-rose-400 mt-1">
              {abuseReports.filter(r => r.status === 'open').length}
            </div>
          </div>
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-white/50 font-sans">Total Pitches</div>
            <div className="text-2xl font-bold font-display text-spotify-green mt-1">
              {submissions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-2xl bg-black/40 p-1.5 border border-white/10 gap-2 max-w-xl">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Curator Verification ({pendingPlaylists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Abuse Reports ({abuseReports.filter(r => r.status === 'open').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'refunds'
              ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Credit Refunds</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'sql'
              ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>SQL & RLS</span>
        </button>
      </div>

      {/* TAB 1: PENDING PLAYLIST APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
              Awaiting Verification ({pendingPlaylists.length})
            </h3>
          </div>

          {pendingPlaylists.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-white/10 bg-black/30 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-spotify-green mx-auto" />
              <div className="text-sm font-bold text-white font-display">ALL CURATORS REVIEWED</div>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                There are no pending curator playlists awaiting manual verification at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-5 rounded-2xl bg-surface/90 border border-white/10 space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={pl.coverArt}
                      alt={pl.title}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate font-display">{pl.title}</h4>
                      <p className="text-xs text-white/60 font-sans truncate">Curator: {pl.curatorName}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-white/40">
                        <span>Cost: {pl.pitchCostCredits} Credits</span>
                        <span>•</span>
                        <span>{pl.trackCount} Tracks</span>
                      </div>
                    </div>
                  </div>

                  {pl.verificationCode && (
                    <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/20 text-xs font-mono text-amber-200 flex items-center justify-between">
                      <span className="text-[11px] text-white/50 font-sans">Verification Code:</span>
                      <span className="font-bold tracking-wider">{pl.verificationCode}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <a
                      href={pl.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Inspect Spotify</span>
                    </a>
                    <div className="flex-1" />
                    <button
                      onClick={() => rejectCuratorPlaylist(pl.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => approveCuratorPlaylist(pl.id)}
                      className="px-4 py-2 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ABUSE REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
              Abuse & Content Reports ({abuseReports.length})
            </h3>
          </div>

          {abuseReports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-white/10 bg-black/30 space-y-3">
              <ShieldCheck className="w-10 h-10 text-spotify-green mx-auto" />
              <div className="text-sm font-bold text-white font-display">MODERATION INBOX CLEAN</div>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                No active abuse or compliance reports have been filed by artists or curators.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {abuseReports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-2xl bg-surface/90 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {report.targetType}
                      </span>
                      <h4 className="text-sm font-bold text-white font-display">
                        Reason: {report.reason}
                      </h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        report.status === 'open' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/60'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 font-sans">
                      Target: <strong className="text-white">{report.targetTitle || report.targetId}</strong>
                    </p>
                    {report.details && (
                      <p className="text-xs text-white/50 font-sans italic">
                        "{report.details}"
                      </p>
                    )}
                    <div className="text-[10px] text-white/40 font-mono">
                      Reported by: {report.reporterEmail || report.reporterId} • {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {report.status === 'open' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => resolveAbuseReport(report.id, 'dismissed', 'Dismissed by admin')}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => resolveAbuseReport(report.id, 'resolved', 'Investigated and resolved')}
                        className="px-3.5 py-1.5 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold transition-colors cursor-pointer"
                      >
                        Resolve Report
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREDIT REFUNDS */}
      {activeTab === 'refunds' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-surface/90 max-w-2xl">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-2">
              Issue Submission Credit Refund
            </h3>
            <p className="text-xs text-white/60 mb-4 font-sans">
              Refund credits to an artist in an atomic database transaction. Automatically restores credits to the user's wallet, records an immutable audit ledger entry, and marks the pitch as refunded.
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-sans text-white/70 mb-1">
                  SUBMISSION ID
                </label>
                <input
                  type="text"
                  required
                  value={refundSubId}
                  onChange={(e) => setRefundSubId(e.target.value)}
                  placeholder="e.g. sub_12345678"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-white/70 mb-1">
                  REFUND REASON
                </label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason for audit log..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isRefunding}
                className="w-full py-3 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isRefunding ? 'Processing Atomic Refund...' : 'Execute Credit Refund'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: SQL MIGRATION & RLS SCHEMA */}
      {activeTab === 'sql' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                Supabase Postgres Production Migration & RLS Policies
              </h3>
              <p className="text-xs text-white/60 font-sans">
                Location: <code className="text-spotify-green font-mono">/supabase/migrations/20261026000000_initial_schema_and_rls.sql</code>
              </p>
            </div>
            <button
              onClick={handleCopySql}
              className="px-4 py-2 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Copied!' : 'Copy Migration SQL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-black/70 border border-white/10 text-[11px] font-mono text-white/80 overflow-x-auto max-h-[500px] leading-relaxed">
            {sqlSchema || 'Loading migration SQL...'}
          </pre>
        </div>
      )}
    </div>
  );
};
