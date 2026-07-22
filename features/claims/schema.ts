import { z } from 'zod';

/** Claim-a-listing form. */
export const claimSchema = z.object({
  centreId: z.string().uuid(),
  evidence: z.string().trim().min(20, 'Please describe how you can prove ownership').max(1000),
});
export type ClaimInput = z.infer<typeof claimSchema>;
