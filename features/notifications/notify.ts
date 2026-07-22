import 'server-only';
import { admin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';

/** Booking lifecycle events that generate a notification + email. */
export type BookingEvent =
  | 'created' | 'confirmed' | 'cancelled' | 'refunded' | 'rescheduled' | 'completed' | 'no_show' | 'waitlist_promoted';

const COPY: Record<BookingEvent, { kind: string; title: string; body: string }> = {
  created: { kind: 'booking_created', title: 'Booking created', body: 'Your booking is reserved. Complete payment to confirm your seat.' },
  confirmed: { kind: 'booking_confirmed', title: 'Booking confirmed', body: 'Your booking is confirmed. See you there!' },
  cancelled: { kind: 'booking_cancelled', title: 'Booking cancelled', body: 'Your booking has been cancelled.' },
  refunded: { kind: 'booking_refunded', title: 'Refund processed', body: 'Your refund has been processed.' },
  rescheduled: { kind: 'booking_rescheduled', title: 'Booking rescheduled', body: 'Your booking has been moved to a new time.' },
  completed: { kind: 'booking_completed', title: 'Session complete', body: 'Thanks for studying with us — leave a review!' },
  no_show: { kind: 'booking_no_show', title: 'Marked as no-show', body: 'You were marked as a no-show for a recent booking.' },
  waitlist_promoted: { kind: 'waitlist_promoted', title: 'A seat opened up!', body: 'You can now book your waitlisted study space.' },
};

/**
 * Fire an in-app notification + email for a booking lifecycle event.
 * Fire-and-forget friendly (never throws): a notification hiccup must not fail
 * the booking mutation that triggered it. Uses the service-role client so it
 * works from any server context, and the existing email queue (degrades when
 * Resend isn't configured).
 */
export async function notifyBooking(
  userId: string,
  event: BookingEvent,
  opts?: { email?: string | null; url?: string },
): Promise<void> {
  const c = COPY[event];
  try {
    await admin.from('notifications').insert({
      user_id: userId, kind: c.kind, title: c.title, body: c.body, url: opts?.url ?? '/account',
    });
  } catch {
    /* in-app insert failed — non-fatal */
  }
  if (opts?.email) {
    void sendEmail({
      to: opts.email,
      template: c.kind,
      subject: c.title,
      html: `<p>${c.body}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}${opts.url ?? '/account'}">View in StudyNook</a></p>`,
    });
  }
}

/** Listing moderation outcomes an owner is told about. */
export type CentreDecision = 'approve' | 'reject' | 'suspend';

const CENTRE_COPY: Record<CentreDecision, { kind: string; title: string; body: string }> = {
  approve: { kind: 'centre_approved', title: 'Your centre is live', body: 'Your listing has been approved and is now visible to students.' },
  reject: { kind: 'centre_rejected', title: 'Your centre needs changes', body: 'Your listing wasn’t approved yet.' },
  suspend: { kind: 'centre_suspended', title: 'Your centre was suspended', body: 'Your listing has been suspended and is no longer visible.' },
};

/**
 * Tell a centre owner the outcome of admin moderation (in-app + email).
 * Reuses the same notification infrastructure as booking events; never throws.
 */
export async function notifyCentreDecision(
  ownerId: string,
  decision: CentreDecision,
  opts?: { email?: string | null; centreName?: string; reason?: string | null },
): Promise<void> {
  const c = CENTRE_COPY[decision];
  const body = opts?.reason ? `${c.body} Reason: ${opts.reason}` : c.body;
  const title = opts?.centreName ? `${c.title}: ${opts.centreName}` : c.title;
  try {
    await admin.from('notifications').insert({
      user_id: ownerId, kind: c.kind, title, body, url: '/owner/centres',
    });
  } catch {
    /* in-app insert failed — non-fatal */
  }
  if (opts?.email) {
    void sendEmail({
      to: opts.email,
      template: c.kind,
      subject: title,
      html: `<p>${body}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/owner/centres">Manage your listing</a></p>`,
    });
  }
}
