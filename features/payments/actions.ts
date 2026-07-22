'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/rbac';
import { action } from '@/lib/auth/action';
import { ActionError, type Result } from '@/lib/result';
import { createOrder, verifyPaymentSignature, razorpayConfigured, publishableKey } from '@/lib/razorpay';
import { notifyBooking } from '@/features/notifications/notify';
import { getUserEmail } from '@/lib/email';
import { z } from 'zod';

const startSchema = z.object({ bookingId: z.string().uuid() });

interface StartResult {
  configured: boolean;
  orderId?: string;
  amount?: number;
  keyId?: string | null;
}

/**
 * Begin payment for a booking. If Razorpay isn't configured, returns
 * { configured:false } and the UI shows a pay-at-centre confirmation instead.
 */
export async function startPayment(raw: unknown): Promise<Result<StartResult>> {
  return action(startSchema, raw, async (input) => {
    const user = await requireUser();
    const db = await createClient();

    const { data: booking } = await db
      .from('bookings')
      .select('id, amount, user_id, payment')
      .eq('id', input.bookingId)
      .maybeSingle();
    if (!booking || booking.user_id !== user.id) throw new ActionError('NOT_FOUND', 'Booking not found.');
    if (booking.payment === 'paid') throw new ActionError('CONFLICT', 'This booking is already paid.');

    if (!razorpayConfigured) return { configured: false };

    const order = await createOrder(booking.amount, booking.id);
    await db.from('bookings').update({ razorpay_order_id: order.id }).eq('id', booking.id);
    return { configured: true, orderId: order.id, amount: order.amount, keyId: publishableKey };
  });
}

const verifySchema = z.object({
  bookingId: z.string().uuid(),
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
});

/** Verify the checkout signature and mark the booking paid + confirmed. */
export async function confirmPayment(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(verifySchema, raw, async (input) => {
    const user = await requireUser();
    if (!verifyPaymentSignature(input.orderId, input.paymentId, input.signature)) {
      throw new ActionError('FORBIDDEN', 'Payment could not be verified.');
    }
    const db = await createClient();
    const { data: updated, error } = await db
      .from('bookings')
      .update({ payment: 'paid', status: 'confirmed', razorpay_payment_id: input.paymentId })
      .eq('id', input.bookingId)
      .eq('user_id', user.id)
      .eq('razorpay_order_id', input.orderId) // bind to the order we created
      .neq('status', 'confirmed')             // exactly-once vs the webhook
      .select('user_id');
    if (error) throw error;
    if (updated && updated.length > 0) {
      const email = await getUserEmail(user.id);
      await notifyBooking(user.id, 'confirmed', { email });
    }
    revalidatePath('/account');
    return { ok: true as const };
  });
}
