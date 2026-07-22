import { z } from 'zod';

export const bookingSchema = z.object({
  centreId: z.string().uuid(),
  resourceId: z.string().uuid(),
  period: z.enum(['hour', 'day', 'month']),
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const cancelSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const rescheduleSchema = z.object({
  bookingId: z.string().uuid(),
  startsAt: z.string().datetime(),
});

export const waitlistSchema = z.object({
  resourceId: z.string().uuid(),
  period: z.enum(['hour', 'day', 'month']),
});

export const refundSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive().optional(), // omitted = full refund
  reason: z.string().max(500).optional(),
});
