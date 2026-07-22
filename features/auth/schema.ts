import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
export type Credentials = z.infer<typeof credentialsSchema>;

/**
 * Sign-up needs a display name: handle_new_user() copies
 * raw_user_meta_data->>'full_name' into profiles.full_name. Without it, email
 * sign-ups have a null name forever (OAuth users get one from the provider).
 */
export const signUpSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2, 'Enter your name').max(80, 'Name is too long'),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Profile fields a user may edit themselves. Role is never editable here. */
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(80, 'Name is too long'),
  phone: z.string().trim().max(20, 'Phone is too long').optional().or(z.literal('')),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const emailOnlySchema = z.object({ email: z.string().trim().email('Enter a valid email') });
export type EmailOnly = z.infer<typeof emailOnlySchema>;

export const newPasswordSchema = z.object({ password: z.string().min(8, 'At least 8 characters') });

export const roleSchema = z.object({ role: z.enum(['student', 'owner']) });
export type RoleInput = z.infer<typeof roleSchema>;
