import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { standardApiLimiter } from '../middleware/rateLimit';

export const adminRouter = Router();

// Protect all admin endpoints with authentication and admin role check
adminRouter.use(standardApiLimiter);
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

/**
 * GET /api/admin/metrics
 * Overview metrics for the Admin Dashboard
 */
adminRouter.get('/metrics', async (req: AuthenticatedRequest, res: Response) => {
  const playlists = await db.getPlaylists();
  const submissions = await db.getSubmissions();
  const reports = await db.getReports();

  const pendingPlaylists = playlists.filter(p => !p.isVerified || p.verificationStatus === 'pending');
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const openReports = reports.filter(r => r.status === 'open');

  res.json({
    totalPlaylists: playlists.length,
    activePlaylists: playlists.filter(p => p.isActive).length,
    pendingPlaylistsCount: pendingPlaylists.length,
    totalSubmissions: submissions.length,
    pendingSubmissionsCount: pendingSubmissions.length,
    openReportsCount: openReports.length
  });
});

/**
 * GET /api/admin/playlists/pending
 * Lists playlists awaiting manual curator ownership verification
 */
adminRouter.get('/playlists/pending', async (req: AuthenticatedRequest, res: Response) => {
  const playlists = await db.getPlaylists();
  const pending = playlists.filter(p => !p.isVerified || p.verificationStatus === 'pending');
  res.json({ playlists: pending });
});

/**
 * POST /api/admin/playlists/:id/approve
 * Admin approves pending curator playlist
 */
adminRouter.post('/playlists/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  const playlist = await db.getPlaylistById(req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  const updated = await db.updatePlaylist(playlist.id, {
    isVerified: true,
    isActive: true,
    verificationStatus: 'verified'
  });

  res.json({
    success: true,
    message: `Playlist "${playlist.title}" approved and verified.`,
    playlist: updated
  });
});

/**
 * POST /api/admin/playlists/:id/reject
 * Admin rejects pending curator playlist
 */
adminRouter.post('/playlists/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  const playlist = await db.getPlaylistById(req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  const updated = await db.updatePlaylist(playlist.id, {
    isVerified: false,
    isActive: false,
    verificationStatus: 'rejected'
  });

  res.json({
    success: true,
    message: `Playlist "${playlist.title}" rejected.`,
    playlist: updated
  });
});

/**
 * GET /api/admin/reports
 * Lists abuse reports
 */
adminRouter.get('/reports', async (req: AuthenticatedRequest, res: Response) => {
  const reports = await db.getReports();
  res.json({ reports });
});

/**
 * POST /api/admin/reports/:id/resolve
 * Resolves or dismisses an abuse report
 */
adminRouter.post('/reports/:id/resolve', async (req: AuthenticatedRequest, res: Response) => {
  const { status, adminNotes } = req.body;
  const newStatus = status === 'dismissed' ? 'dismissed' : 'resolved';
  await db.updateReportStatus(req.params.id, newStatus, adminNotes);
  res.json({ success: true, message: `Report marked as ${newStatus}.` });
});

/**
 * POST /api/admin/submissions/:id/refund
 * Admin refunds credits to artist (e.g. for unresponsive curator SLA breach)
 * Calls atomic Postgres function refund_submission_credits
 */
adminRouter.post('/submissions/:id/refund', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const submissionId = req.params.id;

    const result = await db.refundSubmissionCredits(
      submissionId,
      reason || 'Admin SLA Guarantee Refund'
    );

    res.json({
      success: true,
      message: `Refunded ${result.refundedAmount} credits to artist.`,
      submissionId: result.submissionId,
      refundedAmount: result.refundedAmount,
      newBalance: result.newBalance
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to refund submission credits' });
  }
});

/**
 * GET /api/admin/backup
 * Phase 6: Automated database snapshot export
 */
adminRouter.get('/backup', async (req: AuthenticatedRequest, res: Response) => {
  const snapshot = await db.exportDatabaseSnapshot();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="playlist_plug_backup_${Date.now()}.json"`);
  res.json(snapshot);
});

/**
 * POST /api/admin/run-scheduler
 * Manually trigger the scheduled jobs: weekly credit reset & 48h SLA auto-refund
 */
adminRouter.post('/run-scheduler', async (req: AuthenticatedRequest, res: Response) => {
  const { resetWeeklyFreeCredits, autoRefundSlaBreaches } = await import('../scheduler');
  const [resetRes, refundRes] = await Promise.all([
    resetWeeklyFreeCredits(),
    autoRefundSlaBreaches()
  ]);

  res.json({
    success: true,
    message: `Scheduler ran: ${resetRes.processed} profiles reset, ${refundRes.refunded} submissions auto-refunded.`,
    weeklyResetCount: resetRes.processed,
    autoRefundCount: refundRes.refunded
  });
});

