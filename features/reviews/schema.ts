import { z } from 'zod';

/** Write-a-review form. Shared by RHF (client) and the server action. */
export const reviewSchema = z.object({
  centreId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, 'Pick a rating').max(5),
  body: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

/** Report-a-review form. */
export const reportSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.string().trim().min(3, 'Tell us what’s wrong').max(300),
});
export type ReportInput = z.infer<typeof reportSchema>;
