import { z } from 'zod';

/**
 * Enquiry (contact-a-centre) form. ONE schema, used by React Hook Form on the
 * client AND re-parsed server-side — so validation can never be bypassed.
 */
export const enquirySchema = z.object({
  centreId: z.string().uuid(),
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Message is a little short').max(1000),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;
