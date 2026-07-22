# docs/DEPLOYMENT.md — StudyNook go-live runbook

Order matters. Do these top to bottom.

## 0. Prerequisites
- Node 18+, a Supabase project, a Vercel account, a GitHub repo.
- (Optional, for online payments) a Razorpay account with KYC completed.
- (Optional, for email) a Resend account + a verified sending domain.

## 1. Environment
Copy `.env.example` → `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…          # server-only, never client
NEXT_PUBLIC_SITE_URL=https://studynook.app
RAZORPAY_KEY_ID= / RAZORPAY_KEY_SECRET= / RAZORPAY_WEBHOOK_SECRET=   # optional
RESEND_API_KEY= / EMAIL_FROM=        # optional
```

## 2. Database (apply the schema — the "verify" gate)
```
npm install
npm run db:push        # applies migrations 0001 → 0009 in order
npm run db:types       # regenerates types/database.types.ts from the live DB
```
> `db:types` replaces the hand-written types with generated ones. If `db:push`
> errors, fix the migration and re-run — never edit the DB by hand.

Migration order (dependency-sorted):
`0001_foundation` · `0002_centres` · `0003_directory` · `0004_occupancy` ·
`0005_storage` · `0006_claims_fn` · `0007_onboarding` · `0008_bookings` · `0009_payments`

## 3. Storage
In Supabase → Storage, confirm the `listing-images` bucket exists (created by
`0005`). It's public-read; writes are RLS-scoped to a centre's owner.

## 4. Auth providers
Supabase → Authentication:
- **Email:** enable; confirm the confirmation + recovery templates.
- **Google:** enable the provider, paste Google OAuth client id/secret, and add
  the redirect `<NEXT_PUBLIC_SITE_URL>/auth/callback` (and the Supabase callback
  `<project>.supabase.co/auth/v1/callback` in Google Cloud console).

## 5. First run + verify
```
npm run build          # full TS + typedRoutes check — must pass clean
npm run dev
npm run test:e2e       # once the app is up
```
Then walk the form-to-DB verification in `docs/DATABASE_SCHEMA.md`: submit each
form and confirm the row in Supabase Table Editor / SQL Editor.

## 6. Seed an admin
Roles can't self-escalate to admin. Promote your own user once, in SQL Editor:
```sql
update profiles set role = 'admin' where id = 'YOUR-AUTH-UID';
```

## 7. Payments (optional, when KYC is done)
- Set the three `RAZORPAY_*` env vars. Without them, booking still works and the
  UI shows "pay at the centre" (graceful fallback).
- Add a webhook in the Razorpay dashboard → `<site>/api/webhooks/razorpay`,
  events `payment.captured` + `order.paid`; set `RAZORPAY_WEBHOOK_SECRET` to match.

## 8. Vercel
- Import the GitHub repo; add all env vars from step 1 (Production + Preview).
- Deploy. Enable Analytics + Speed Insights (already wired in the layout).
- Set the custom domain; update `NEXT_PUBLIC_SITE_URL` and the OAuth redirects.

## Go-live checklist
- [ ] `npm run build` passes with no type/route errors
- [ ] All 9 migrations applied; `db:types` regenerated
- [ ] Google + email auth work end-to-end (sign up → verify → onboard)
- [ ] Each form verified in Supabase (see DATABASE_SCHEMA.md)
- [ ] One admin user promoted; `/admin` reachable only by them
- [ ] Storage upload works and images render on a listing
- [ ] Booking → (pay or pay-at-centre) → confirmed
- [ ] Razorpay webhook reachable + signature verified (if payments on)
- [ ] robots.txt / sitemap.xml correct for the production domain
- [ ] Design-system decision made (Inter/minimal vs. green/gold brand)
