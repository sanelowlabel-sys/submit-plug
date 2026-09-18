import { Router, Request, Response } from 'express';
import { db } from '../db';
import { realtime } from '../websocket';
import {
  sendEmailNotification,
  generateCuratorSubmissionEmailHtml,
  generateArtistDecisionEmailHtml
} from '../email';

export const submissionsRouter = Router();

// Get submissions list
submissionsRouter.get('/', (req: Request, res: Response) => {
  const { artistId, curatorId, status, playlistId } = req.query;
  let list = db.getSubmissions();

  if (artistId) {
    list = list.filter((s) => s.artistId === artistId);
  }
  if (curatorId) {
    list = list.filter((s) => s.curatorId === curatorId);
  }
  if (status) {
    list = list.filter((s) => s.status === status);
  }
  if (playlistId) {
    list = list.filter((s) => s.playlistId === playlistId);
  }

  res.json({ submissions: list, count: list.length });
});

// Submit pitch
submissionsRouter.post('/', async (req: Request, res: Response) => {
  const {
    artistId,
    playlistId,
    track,
    pitchType,
    customMessage,
    gateActionsCompleted
  } = req.body;

  if (!artistId || !playlistId || !track) {
    return res.status(400).json({ error: 'artistId, playlistId, and track are required' });
  }

  const artist = db.getUserById(artistId);
  if (!artist) {
    return res.status(404).json({ error: 'Artist user not found' });
  }

  const playlist = db.getPlaylistById(playlistId);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  // Determine cost
  const isFree = pitchType === 'free';
  const pitchCost = isFree ? 0 : (playlist.pitchCostCredits || 1);

  // Validate credits
  if (isFree) {
    if ((artist.freeWeeklyCredits || 0) < 1) {
      return res.status(400).json({
        error: 'You have used your free weekly pitch allowance. Top up credits or wait for your weekly reset.'
      });
    }
    // Deduct free credit
    db.updateUser(artist.id, {
      freeWeeklyCredits: Math.max(0, (artist.freeWeeklyCredits || 0) - 1)
    });
  } else {
    if ((artist.creditBalance || 0) < pitchCost) {
      return res.status(400).json({
        error: `Insufficient credits. You need ${pitchCost} credits to submit a premium pitch.`
      });
    }
    // Deduct premium credits
    db.updateUser(artist.id, {
      creditBalance: Math.max(0, (artist.creditBalance || 0) - pitchCost)
    });
  }

  // Create submission record
  const submission = db.createSubmission({
    track,
    playlistId: playlist.id,
    playlistTitle: playlist.title,
    playlistCover: playlist.coverArt,
    curatorId: playlist.curatorId,
    curatorName: playlist.curatorName,
    artistId: artist.id,
    artistName: artist.name,
    artistAvatar: artist.avatarUrl,
    pitchType: isFree ? 'free' : 'premium',
    pitchCost,
    customMessage: customMessage || '',
    status: 'pending',
    feedbackTags: [],
    gateActionsCompleted: gateActionsCompleted || {
      followedCurator: true,
      followedPlaylist: true,
      savedSong: false
    }
  });

  // Log transaction
  const tx = db.addTransaction({
    userId: artist.id,
    userName: artist.name,
    amount: -pitchCost,
    type: isFree ? 'free_pitch' : 'premium_pitch',
    description: `Submitted "${track.title}" to ${playlist.title}`,
    status: 'completed'
  });

  // Fetch updated artist wallet
  const refreshedArtist = db.getUserById(artist.id);

  // Real-time WebSocket broadcasts
  realtime.broadcastSubmission('created', submission);
  if (refreshedArtist) {
    realtime.broadcastWallet(artist.id, {
      creditBalance: refreshedArtist.creditBalance,
      freeWeeklyCredits: refreshedArtist.freeWeeklyCredits,
      transaction: tx
    });
  }

  // Send automated HTML email to curator
  try {
    const curatorUser = db.getUserById(playlist.curatorId);
    const curatorEmail = curatorUser?.email || `${playlist.curatorSpotifyId}@curator.spotify.com`;
    const emailHtml = generateCuratorSubmissionEmailHtml(submission, playlist);

    await sendEmailNotification({
      to: curatorEmail,
      subject: `🎵 New Submission: "${track.title}" submitted to "${playlist.title}"`,
      template: 'new_submission_curator',
      recipientRole: 'curator',
      trackTitle: track.title,
      playlistTitle: playlist.title,
      curatorName: playlist.curatorName,
      artistName: artist.name,
      html: emailHtml
    });
  } catch (err) {
    console.error('[Submissions] Failed to dispatch curator submission email:', err);
  }

  res.status(201).json({
    success: true,
    submission,
    wallet: {
      creditBalance: refreshedArtist?.creditBalance,
      freeWeeklyCredits: refreshedArtist?.freeWeeklyCredits
    }
  });
});

// Review submission (Curator action: Approve / Decline)
submissionsRouter.post('/:id/review', async (req: Request, res: Response) => {
  const { action, feedbackTags, feedbackNote, spotifyPlacementUrl } = req.body;
  const submissionId = req.params.id;

  if (!action || (action !== 'approve' && action !== 'decline')) {
    return res.status(400).json({ error: 'Action must be "approve" or "decline"' });
  }

  const submission = db.getSubmissionById(submissionId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const newStatus = action === 'approve' ? 'approved' : 'declined';
  const reviewedAt = new Date().toISOString();

  const updated = db.updateSubmission(submissionId, {
    status: newStatus,
    feedbackTags: feedbackTags || [],
    feedbackNote: feedbackNote || '',
    reviewedAt,
    ...(spotifyPlacementUrl ? { spotifyPlacementUrl } : {})
  });

  if (!updated) {
    return res.status(500).json({ error: 'Failed to update submission' });
  }

  // Record curator activity
  const curatorActivity = db.addCuratorActivity({
    curatorId: submission.curatorId,
    curatorName: submission.curatorName,
    curatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    action: action === 'approve' ? 'approved' : 'reviewed',
    playlistTitle: submission.playlistTitle,
    trackTitle: submission.track.title,
    timestamp: 'Just now'
  });

  // Real-time WebSocket broadcasts
  realtime.broadcastSubmission('updated', updated);
  realtime.broadcastCuratorActivity(curatorActivity);

  // Send automated HTML email to artist
  try {
    const artistUser = db.getUserById(submission.artistId);
    const artistEmail = artistUser?.email || 'artist@playlistplug.com';
    const emailHtml = generateArtistDecisionEmailHtml(
      updated,
      action,
      feedbackTags || [],
      feedbackNote
    );

    await sendEmailNotification({
      to: artistEmail,
      subject: action === 'approve'
        ? `🎉 Approved! "${submission.track.title}" added to ${submission.playlistTitle}`
        : `Decision Update: "${submission.track.title}" on ${submission.playlistTitle}`,
      template: action === 'approve' ? 'submission_approved_artist' : 'submission_declined_artist',
      recipientRole: 'artist',
      trackTitle: submission.track.title,
      playlistTitle: submission.playlistTitle,
      curatorName: submission.curatorName,
      artistName: submission.artistName,
      html: emailHtml
    });
  } catch (err) {
    console.error('[Submissions] Failed to dispatch artist decision email:', err);
  }

  res.json({
    success: true,
    submission: updated
  });
});
