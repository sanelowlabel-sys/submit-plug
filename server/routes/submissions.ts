import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { standardApiLimiter, sensitiveActionLimiter } from '../middleware/rateLimit';
import { validateSubmissionInput, sanitizeText } from '../middleware/validation';
import {
  sendEmailNotification,
  generateCuratorSubmissionEmailHtml,
  generateArtistDecisionEmailHtml
} from '../email';

export const submissionsRouter = Router();

submissionsRouter.use(standardApiLimiter);

/**
 * GET /api/submissions
 * RLS: Artists see only their own submissions. Curators see submissions to their playlists.
 * User ID is strictly taken from the verified token.
 */
submissionsRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { status, playlistId, roleView } = req.query;

    let list;
    if (req.user.role === 'admin') {
      list = await db.getSubmissions({
        status: status ? String(status) : undefined,
        playlistId: playlistId ? String(playlistId) : undefined
      });
    } else if (req.user.role === 'curator' || roleView === 'curator') {
      list = await db.getSubmissions({
        curatorId: req.user.id,
        status: status ? String(status) : undefined,
        playlistId: playlistId ? String(playlistId) : undefined
      });
    } else {
      // Default to artist view: artist sees their own submissions
      list = await db.getSubmissions({
        artistId: req.user.id,
        status: status ? String(status) : undefined,
        playlistId: playlistId ? String(playlistId) : undefined
      });
    }

    res.json({ submissions: list, count: list.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch submissions' });
  }
});

/**
 * POST /api/submissions
 * Submit track pitch.
 * Phase 3 requirement: SPENDING CREDITS ON A PITCH MUST HAPPEN IN THE SAME TRANSACTION AS CREATING THE SUBMISSION.
 * Artist ID is taken STRICTLY from req.user.id (verified token).
 */
submissionsRouter.post('/', requireAuth, sensitiveActionLimiter, validateSubmissionInput, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { playlistId, track, pitchType, customMessage } = req.body;

  try {
    // Atomic spend and submission creation in database engine
    const { submission, newBalance } = await db.spendCreditsAndCreateSubmission({
      artistId: req.user.id, // Strictly from verified JWT
      playlistId,
      track,
      pitchType: pitchType === 'free' ? 'free' : 'premium',
      customMessage: sanitizeText(customMessage, 500)
    });

    // Send asynchronous transactional email notification to curator
    const playlist = await db.getPlaylistById(playlistId);
    if (playlist) {
      const curatorUser = await db.getUserProfile(playlist.curatorId);
      if (curatorUser?.email) {
        sendEmailNotification({
          to: curatorUser.email,
          subject: `New Pitch: "${track.title}" submitted to "${playlist.title}"`,
          template: 'new_submission_curator',
          trackTitle: track.title,
          playlistTitle: playlist.title,
          curatorName: playlist.curatorName,
          artistName: req.user.name,
          html: generateCuratorSubmissionEmailHtml(
            track.title,
            req.user.name,
            playlist.title,
            pitchType,
            customMessage
          )
        }).catch(err => console.warn('[Email] Curator notification dispatch error:', err));
      }
    }

    res.status(201).json({
      success: true,
      message: 'Submission successfully sent to curator review queue.',
      submission,
      newBalance
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit pitch' });
  }
});

/**
 * POST /api/submissions/:id/review
 * Review submission (approve or decline).
 * Phase 2 requirement: ONLY A PLAYLIST'S OWNER CAN REVIEW ITS SUBMISSIONS.
 */
submissionsRouter.post('/:id/review', requireAuth, sensitiveActionLimiter, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { decision, feedbackTags, feedbackNote, spotifyPlacementUrl } = req.body;

  if (decision !== 'approve' && decision !== 'decline') {
    return res.status(400).json({ error: 'Decision must be "approve" or "decline".' });
  }

  const submission = await db.getSubmissionById(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  // Fetch playlist to check ownership
  const playlist = await db.getPlaylistById(submission.playlistId);
  if (!playlist) {
    return res.status(404).json({ error: 'Associated playlist not found' });
  }

  // Enforce security rule: ONLY playlist owner (curatorId === req.user.id) or admin can review!
  if (playlist.curatorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: only the verified playlist owner can review submissions for this playlist.'
    });
  }

  const sanitizedTags = Array.isArray(feedbackTags) ? feedbackTags.map(t => sanitizeText(t, 50)) : [];
  const sanitizedNote = sanitizeText(feedbackNote, 1000);

  const updated = await db.reviewSubmission({
    submissionId: submission.id,
    decision,
    feedbackTags: sanitizedTags,
    feedbackNote: sanitizedNote,
    spotifyPlacementUrl: spotifyPlacementUrl ? String(spotifyPlacementUrl).trim() : undefined
  });

  // Send transactional email to artist
  const artist = await db.getUserProfile(submission.artistId);
  if (artist?.email) {
    sendEmailNotification({
      to: artist.email,
      subject: decision === 'approve'
        ? `Accepted! "${submission.track.title}" added to "${submission.playlistTitle}"`
        : `Curator Feedback on "${submission.track.title}" for "${submission.playlistTitle}"`,
      template: decision === 'approve' ? 'submission_approved_artist' : 'submission_declined_artist',
      trackTitle: submission.track.title,
      playlistTitle: submission.playlistTitle,
      curatorName: req.user.name,
      artistName: artist.name,
      html: generateArtistDecisionEmailHtml(
        submission.track.title,
        submission.playlistTitle,
        decision === 'approve' ? 'approved' : 'declined',
        sanitizedNote,
        spotifyPlacementUrl
      )
    }).catch(err => console.warn('[Email] Artist notification dispatch error:', err));
  }

  res.json({
    success: true,
    message: decision === 'approve' ? 'Submission approved.' : 'Submission declined with curator feedback.',
    submission: updated
  });
});
