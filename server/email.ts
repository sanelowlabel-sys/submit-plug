import nodemailer from 'nodemailer';
import { db } from './db';
import { SubmissionRecord, PlaylistRecord, EmailLogRecord } from './types';

// Optional transporter if SMTP is provided
let transporter: any = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (err) {
    console.warn('[Email] SMTP initialization warning:', err);
  }
}

interface SendMailParams {
  to: string;
  subject: string;
  template: 'new_submission_curator' | 'submission_approved_artist' | 'submission_declined_artist';
  recipientRole: 'artist' | 'curator';
  trackTitle: string;
  playlistTitle: string;
  curatorName: string;
  artistName: string;
  html: string;
}

export async function sendEmailNotification(params: SendMailParams): Promise<EmailLogRecord> {
  const { to, subject, html, template, recipientRole, trackTitle, playlistTitle, curatorName, artistName } = params;

  console.log(`[Email] Dispatching automated email to ${to}: "${subject}"`);

  // 1. Try Resend if API key is provided
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Submit Plug <notifications@submitplug.com>',
          to,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[Email] Resend API error response:', errorText);
      } else {
        console.log(`[Email] Successfully delivered via Resend API to ${to}`);
      }
    } catch (err) {
      console.warn('[Email] Resend delivery network error:', err);
    }
  } else if (transporter) {
    // 2. Try SMTP if configured
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Submit Plug" <notifications@submitplug.com>',
        to,
        subject,
        html,
      });
      console.log(`[Email] Successfully delivered via SMTP to ${to}`);
    } catch (err) {
      console.warn('[Email] SMTP delivery failed:', err);
    }
  }

  // 3. Always log in database for real-time in-app delivery inspection
  const logged = db.logEmail({
    to,
    subject,
    template,
    recipientRole,
    trackTitle,
    playlistTitle,
    curatorName,
    artistName,
    html,
    status: 'delivered',
  });

  return logged;
}

// Generate Curator New Submission Email HTML
export function generateCuratorSubmissionEmailHtml(submission: SubmissionRecord, playlist: PlaylistRecord): string {
  const pitchBadge = submission.pitchType === 'premium' ? '⚡ Premium Pitch (Guaranteed Review)' : '🌱 Free Weekly Pitch';
  const audioPreviewBtn = submission.track.previewUrl
    ? `<a href="${submission.track.previewUrl}" target="_blank" style="display:inline-block;background:#BE1E2F;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;margin-right:12px;">▶ Listen Audio Preview</a>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #121212; color: #ffffff; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #1a1a1a; border: 1px solid #333333; border-radius: 12px; overflow: hidden; }
    .header { background: #141414; border-bottom: 2px solid #BE1E2F; padding: 24px; text-align: center; }
    .content { padding: 24px; line-height: 1.6; }
    .track-box { display: flex; background: #222222; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #3a3a3a; }
    .badge { display: inline-block; background: #BE1E2F; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888888; border-top: 1px solid #282828; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">SUBMIT PLUG</h1>
      <p style="margin:4px 0 0 0;color:#BE1E2F;font-size:13px;font-weight:bold;">NEW PLAYLIST SUBMISSION RECEIVED</p>
    </div>
    <div class="content">
      <p>Hey <strong>${playlist.curatorName}</strong>,</p>
      <p>An artist just submitted a track for consideration to your playlist <strong>${playlist.title}</strong>.</p>
      
      <div style="margin: 16px 0;">
        <span class="badge">${pitchBadge}</span>
      </div>

      <div class="track-box">
        <div>
          <h2 style="margin:0 0 4px 0;color:#ffffff;font-size:18px;">${submission.track.title}</h2>
          <p style="margin:0 0 8px 0;color:#b3b3b3;font-size:14px;">Artist: <strong>${submission.track.artist}</strong></p>
          <p style="margin:0;color:#888888;font-size:12px;">Genre: ${submission.track.genre} • BPM: ${submission.track.bpm || 'N/A'}</p>
        </div>
      </div>

      ${submission.customMessage ? `
        <div style="background:#181818;border-left:3px solid #BE1E2F;padding:12px 16px;margin:16px 0;font-style:italic;color:#cccccc;">
          "${submission.customMessage}"
        </div>
      ` : ''}

      <div style="margin-top: 24px; text-align:center;">
        ${audioPreviewBtn}
        <a href="${submission.track.spotifyUrl}" target="_blank" style="display:inline-block;background:#1DB954;color:#000000;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">Spotify Track</a>
      </div>

      <p style="margin-top: 28px; font-size: 13px; color: #aaaaaa;">
        Please review this track inside your Submit Plug Curator Portal to complete review and award gate actions.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Submit Plug. Automated curator notification.
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Generate Artist Decision Email HTML (Approved or Declined)
export function generateArtistDecisionEmailHtml(
  submission: SubmissionRecord,
  action: 'approve' | 'decline',
  feedbackTags: string[],
  feedbackNote?: string
): string {
  const isApproved = action === 'approve';
  const statusColor = isApproved ? '#1DB954' : '#BE1E2F';
  const statusTitle = isApproved ? '🎉 TRACK APPROVED & PLACED!' : 'DECISION UPDATE: NOT A FIT THIS TIME';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #121212; color: #ffffff; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #1a1a1a; border: 1px solid #333333; border-radius: 12px; overflow: hidden; }
    .header { background: #141414; border-bottom: 2px solid ${statusColor}; padding: 24px; text-align: center; }
    .content { padding: 24px; line-height: 1.6; }
    .status-badge { display: inline-block; background: ${statusColor}; color: ${isApproved ? '#000000' : '#ffffff'}; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: bold; }
    .tags { margin: 12px 0; }
    .tag { display: inline-block; background: #282828; color: #e0e0e0; padding: 4px 10px; border-radius: 4px; font-size: 12px; margin: 2px 4px 2px 0; border: 1px solid #444; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888888; border-top: 1px solid #282828; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">SUBMIT PLUG</h1>
      <p style="margin:4px 0 0 0;color:${statusColor};font-size:14px;font-weight:bold;">${statusTitle}</p>
    </div>
    <div class="content">
      <p>Hey <strong>${submission.artistName}</strong>,</p>
      
      <p>
        Curator <strong>${submission.curatorName}</strong> has completed their review of your track 
        <strong>"${submission.track.title}"</strong> for playlist <strong>"${submission.playlistTitle}"</strong>.
      </p>

      <div style="margin: 16px 0; text-align:center;">
        <span class="status-badge">${isApproved ? 'ADDED TO SPOTIFY PLAYLIST' : 'FEEDBACK PROVIDED'}</span>
      </div>

      ${isApproved ? `
        <div style="background:#132e1d;border:1px solid #1DB954;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
          <h3 style="margin:0 0 6px 0;color:#1DB954;">Congratulations!</h3>
          <p style="margin:0 0 14px 0;font-size:14px;color:#d0f0db;">Your song has been added into rotation on Spotify!</p>
          ${submission.spotifyPlacementUrl ? `
            <a href="${submission.spotifyPlacementUrl}" target="_blank" style="display:inline-block;background:#1DB954;color:#000000;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:bold;">View on Spotify</a>
          ` : ''}
        </div>
      ` : `
        <p style="color:#b3b3b3;">While your track wasn't selected for this specific playlist rotation, the curator shared the following constructive evaluation:</p>
      `}

      ${feedbackTags && feedbackTags.length > 0 ? `
        <div style="margin:16px 0;">
          <p style="margin:0 0 6px 0;font-size:13px;color:#aaaaaa;font-weight:bold;">CURATOR TAGS:</p>
          <div class="tags">
            ${feedbackTags.map(t => `<span class="tag">${t}</span>`).join(' ')}
          </div>
        </div>
      ` : ''}

      ${feedbackNote ? `
        <div style="background:#1f1f1f;border-left:3px solid ${statusColor};padding:12px 16px;margin:16px 0;color:#e0e0e0;font-style:italic;">
          "${feedbackNote}"
        </div>
      ` : ''}

      <div style="margin-top:28px;text-align:center;">
        <a href="/?tab=artist" style="display:inline-block;background:#BE1E2F;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:6px;font-weight:bold;">Open Campaign Tracker</a>
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Submit Plug. Real-time playlist pitching network.
    </div>
  </div>
</body>
</html>
  `.trim();
}
