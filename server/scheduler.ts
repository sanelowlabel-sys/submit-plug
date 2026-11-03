import { db } from './db';
import { getSupabaseClient } from './supabase';

/**
 * Scheduled Jobs:
 * 1. Weekly free-credit reset (restores 2 free pitch credits every 7 days)
 * 2. 48-Hour SLA Guarantee Auto-Refund (automatically refunds artist credits if curator fails to review within 48 hours)
 */

export async function resetWeeklyFreeCredits(): Promise<{ processed: number }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { processed: 0 };

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: eligibleProfiles, error } = await supabase
      .from('profiles')
      .select('id, free_weekly_credits, last_weekly_reset')
      .lt('last_weekly_reset', sevenDaysAgo);

    if (error) {
      console.warn('[Scheduler] Error querying profiles for weekly reset:', error.message);
      return { processed: 0 };
    }

    if (!eligibleProfiles || eligibleProfiles.length === 0) {
      return { processed: 0 };
    }

    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const prof of eligibleProfiles) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          free_weekly_credits: 2,
          last_weekly_reset: now
        })
        .eq('id', prof.id);

      if (!updateErr) {
        updatedCount++;
      }
    }

    console.log(`[Scheduler] Reset weekly free credits for ${updatedCount} profiles.`);
    return { processed: updatedCount };
  } catch (err: any) {
    console.error('[Scheduler] Exception during weekly credit reset:', err);
    return { processed: 0 };
  }
}

export async function autoRefundSlaBreaches(): Promise<{ refunded: number }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { refunded: 0 };

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: expiredSubmissions, error } = await supabase
      .from('submissions')
      .select('id, track_id, track, artist_id, playlist_title, pitch_cost, submitted_at, status')
      .eq('status', 'pending')
      .lt('submitted_at', fortyEightHoursAgo);

    if (error) {
      console.warn('[Scheduler] Error querying expired submissions:', error.message);
      return { refunded: 0 };
    }

    if (!expiredSubmissions || expiredSubmissions.length === 0) {
      return { refunded: 0 };
    }

    let refundCount = 0;
    for (const sub of expiredSubmissions) {
      try {
        await db.refundSubmissionCredits(sub.id, '48-Hour SLA Guarantee Auto-Refund');
        refundCount++;
        console.log(`[Scheduler] Auto-refunded overdue submission ${sub.id} ("${sub.playlist_title}")`);
      } catch (refundErr: any) {
        console.error(`[Scheduler] Failed to auto-refund submission ${sub.id}:`, refundErr);
      }
    }

    console.log(`[Scheduler] 48-Hour SLA sweep complete. Auto-refunded ${refundCount} submissions.`);
    return { refunded: refundCount };
  } catch (err: any) {
    console.error('[Scheduler] Exception during 48-Hour SLA auto-refund sweep:', err);
    return { refunded: 0 };
  }
}

export function startScheduler() {
  console.log('[Scheduler] Initializing automated background jobs (Weekly Reset & 48h SLA Auto-Refund)...');

  // Run on startup
  resetWeeklyFreeCredits().catch(() => {});
  autoRefundSlaBreaches().catch(() => {});

  // Run hourly check (every 3600 seconds)
  const interval = setInterval(() => {
    resetWeeklyFreeCredits().catch(() => {});
    autoRefundSlaBreaches().catch(() => {});
  }, 60 * 60 * 1000);

  // Unref so process can cleanly exit if needed
  if (interval.unref) {
    interval.unref();
  }
}
