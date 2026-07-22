import { describe, it, expect } from 'vitest';
import { credentialsSchema, signUpSchema, profileSchema, roleSchema } from '@/features/auth/schema';

/**
 * Regression guards for two verified defects fixed in the onboarding pass:
 *  1. Email sign-ups had no name -> profiles.full_name was permanently null,
 *     so owners/admins saw "Guest" for every email-registered student.
 *  2. (see admin actions) owners were never notified of approve/reject.
 * These tests import the REAL schema module.
 */

describe('signUpSchema — defect 1 guard (name is captured at registration)', () => {
  it('requires a full name', () => {
    const r = signUpSchema.safeParse({ email: 'a@b.com', password: 'password1' });
    expect(r.success).toBe(false);
  });

  it('accepts a valid signup with a name', () => {
    const r = signUpSchema.safeParse({ email: 'a@b.com', password: 'password1', fullName: 'Asha R' });
    expect(r.success).toBe(true);
  });

  it('rejects a blank or 1-char name', () => {
    for (const fullName of ['', ' ', 'A']) {
      expect(signUpSchema.safeParse({ email: 'a@b.com', password: 'password1', fullName }).success).toBe(false);
    }
  });

  it('trims surrounding whitespace from the name', () => {
    const r = signUpSchema.safeParse({ email: 'a@b.com', password: 'password1', fullName: '  Asha R  ' });
    expect(r.success && r.data.fullName).toBe('Asha R');
  });

  it('caps absurdly long names', () => {
    const r = signUpSchema.safeParse({ email: 'a@b.com', password: 'password1', fullName: 'x'.repeat(200) });
    expect(r.success).toBe(false);
  });

  it('still enforces the base credential rules', () => {
    expect(signUpSchema.safeParse({ email: 'nope', password: 'password1', fullName: 'Asha' }).success).toBe(false);
    expect(signUpSchema.safeParse({ email: 'a@b.com', password: 'short', fullName: 'Asha' }).success).toBe(false);
  });
});

describe('credentialsSchema — sign-in must NOT require a name', () => {
  it('accepts email + password only (login is unbroken by the signup change)', () => {
    expect(credentialsSchema.safeParse({ email: 'a@b.com', password: 'password1' }).success).toBe(true);
  });
});

describe('profileSchema — self-service profile edit', () => {
  it('accepts name with optional phone', () => {
    expect(profileSchema.safeParse({ fullName: 'Asha R' }).success).toBe(true);
    expect(profileSchema.safeParse({ fullName: 'Asha R', phone: '' }).success).toBe(true);
    expect(profileSchema.safeParse({ fullName: 'Asha R', phone: '+91 90000 00000' }).success).toBe(true);
  });

  it('requires a name', () => {
    expect(profileSchema.safeParse({ phone: '123' }).success).toBe(false);
  });

  it('does not accept a role field (no privilege escalation via profile edit)', () => {
    const r = profileSchema.safeParse({ fullName: 'Asha R', role: 'admin' });
    // zod strips unknown keys — role must never reach the update payload
    expect(r.success && 'role' in r.data).toBe(false);
  });
});

describe('roleSchema — unchanged escalation guard', () => {
  it('still rejects admin', () => {
    expect(roleSchema.safeParse({ role: 'admin' }).success).toBe(false);
  });
});
