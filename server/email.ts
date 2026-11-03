import nodemailer from 'nodemailer';
import { db, EmailLogRecord } from './db';

interface SendMailParams {
  to: string;
  subject: string;
  template: 'new_submission_curator' | 'submission_approved_artist' | 'submission_declined_artist' | 'credit_refund_artist';
  trackTitle?: string;
  playlistTitle?: string;
  curatorName?: string;
  artistName?: string;
  html: string;
}

/**
 * Dispatches transactional email through a verified domain (Resend with SPF/DKIM or SMTP)
 */
export async function sendEmailNotification(params: SendMailParams): Promise<EmailLogRecord> {
  const { to, subject, html, template, trackTitle, playlistTitle } = params;
  let status = 'delivered';
  let errorMessage: string | undefined;

  // 1. Resend API with verified domain headers (SPF/DKIM)
  if (process.env.RESEND_API_KEY) {
    try {
      const fromDomain = process.env.EMAIL_FROM || 'Playlist Plug <notifications@playlistplug.com>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromDomain,
          to,
          subject,
          html,
          headers: {
            'X-Entity-Ref-ID': `playlistplug-${Date.now()}`
          }
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        status = 'failed';
        errorMessage = `Resend error (${res.status}): ${errorText}`;
        console.warn('[Email] Resend API error response:', errorMessage);
      } else {
        console.log(`[Email] Transactional email delivered via Resend to ${to}`);
      }
    } catch (err: any) {
      status = 'failed';
      errorMessage = err.message || 'Network error';
      console.warn('[Email] Resend delivery network error:', err);
    }
  } else {
    // Development mode log
    console.log(`[Email Simulation] Dispatching to ${to}: "${subject}" (RESEND_API_KEY not set)`);
  }

  // 2. Log in database for audit trail
  const logged = await db.logEmail({
    recipient: to,
    subject,
    template,
    trackTitle,
    playlistTitle,
    status,
    errorMessage
  });

  return logged;
}

export function generateCuratorSubmissionEmailHtml(
  trackTitle: string,
  artistName: string,
  playlistTitle: string,
  pitchType: string,
  customMessage?: string
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #121212; color: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #282828;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1DB954; margin: 0; font-size: 20px; letter-spacing: 1px;">PLAYLIST PLUG</h2>
        <p style="color: #888888; font-size: 12px; margin-top: 4px;">NEW SUBMISSION RECEIVED</p>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #e0e0e0;">
        Artist <strong>${artistName}</strong> just submitted <strong>"${trackTitle}"</strong> to your Spotify playlist <strong>"${playlistTitle}"</strong>.
      </p>
      <div style="background: #1e1e1e; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #333;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #888;">Pitch Type: <span style="color: #1DB954; font-weight: bold; text-transform: uppercase;">${pitchType}</span></p>
        ${customMessage ? `<p style="margin: 0; font-size: 13px; color: #bbb;"><em>"${customMessage}"</em></p>` : ''}
      </div>
      <p style="font-size: 13px; color: #888;">Please review this submission within 48 hours to maintain your verified curator status and playlist score.</p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="${process.env.APP_URL || 'https://playlistplug.com'}" style="background: #1DB954; color: #000; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: bold; font-size: 13px; display: inline-block;">
          Open Curator Review Deck
        </a>
      </div>
    </div>
  `;
}

export function generateArtistDecisionEmailHtml(
  trackTitle: string,
  playlistTitle: string,
  decision: 'approved' | 'declined',
  feedbackNote?: string,
  spotifyPlacementUrl?: string
): string {
  const isApproved = decision === 'approved';
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #121212; color: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #282828;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1DB954; margin: 0; font-size: 20px; letter-spacing: 1px;">PLAYLIST PLUG</h2>
        <p style="color: ${isApproved ? '#1DB954' : '#e0e0e0'}; font-size: 12px; margin-top: 4px; font-weight: bold;">
          ${isApproved ? 'TRACK ACCEPTED FOR ROTATION!' : 'SUBMISSION FEEDBACK'}
        </p>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #e0e0e0;">
        ${isApproved
          ? `Great news! Your track <strong>"${trackTitle}"</strong> has been approved and added to <strong>"${playlistTitle}"</strong>.`
          : `The curator for <strong>"${playlistTitle}"</strong> has reviewed your pitch for <strong>"${trackTitle}"</strong>.`
        }
      </p>
      ${feedbackNote ? `
        <div style="background: #1e1e1e; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #333;">
          <p style="margin: 0; font-size: 13px; color: #bbb;"><strong>Curator Feedback:</strong> "${feedbackNote}"</p>
        </div>
      ` : ''}
      ${spotifyPlacementUrl ? `
        <div style="text-align: center; margin-top: 24px;">
          <a href="${spotifyPlacementUrl}" style="background: #1DB954; color: #000; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: bold; font-size: 13px; display: inline-block;">
            Listen on Spotify
          </a>
        </div>
      ` : ''}
    </div>
  `;
}
