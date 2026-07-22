# docs/FEATURES.md — feature status & manual setup

Legend: ✅ built · 🟡 partial · ⬜ planned (applicable, not yet built)

## Foundation ✅
Strict TS, Tailwind+shadcn tokens, Supabase clients (browser/server/admin),
RBAC guards, `Result`, TanStack provider, generated-shaped DB types.

## Centres — discovery & detail 🟡 (reference slice)
✅ schema+RLS+indexes, keyset service, `/api/centres`, TanStack infinite hook,
card + all states + feed. ⬜ detail page, filters UI, owner create form UI.

## Directory data layer ✅ (migration 0003)
Status lifecycle, categories, locations, images, enquiries, reviews + reports,
claims, saved, featured, notifications, audit logs, onboarding, email logs —
all with RLS + indexes. UIs for these are ⬜ (next batch).

## SEO ✅ infra
`sitemap.ts` (approved listings + categories + locations), `robots.ts`,
`lib/seo.ts` (LocalBusiness + BreadcrumbList JSON-LD, `noindex` helper).

## Security infra ✅
`lib/rate-limit.ts` (fixed-window), `lib/audit.ts` (`log_audit`), RLS everywhere,
`middleware.ts` (session refresh + `/admin` `/owner` `/account` route protection).

## Admin dashboard ✅
`/admin` overview (stat cards), `/admin/centres` approval queue (approve/reject
with reason), `/admin/reviews` report moderation (remove/keep), `/admin/audit`
audit trail. Server-side role guard in the layout + middleware; every action is
`requireRole('admin')` + Zod + audited via `logAudit`. Loading/empty/error states.

## Testing 🟡
Playwright config + positive/negative specs (discovery, auth-guard). Vitest config.
⬜ full journey coverage (owner→submit→approve→public, enquiry, claim, moderation).

## Applicable — planned next (⬜)
Categories/locations
pages · listing detail + not-found for pending/rejected/suspended · enquiry form
+ notifications + confirmation email · reviews UI + reporting · claim flow ·
saved listings · owner listing CRUD + image upload (Storage) · Google OAuth +
password reset + email verification + onboarding · Vercel Analytics.

## Manual setup (per feature, when built)
- **OAuth:** enable Google in Supabase Auth; redirect `…/auth/v1/callback`.
- **Storage:** create `listing-images` bucket (public) + `listing-docs` (private, signed URLs).
- **Razorpay:** complete KYC for live capture; set webhook secret.
- **Resend:** verify sending domain; set `EMAIL_FROM`.
- **WhatsApp:** register + get templates approved.
- **Vercel:** enable Analytics + Speed Insights.

## Form-to-DB verification (mandate) ✅ docs
`docs/FORM_TO_DB_MAPPING.md` (13 forms mapped) + `docs/DATABASE_SCHEMA.md` (ERD +
per-form verification SQL). Forms are code-complete; "verified" awaits a live
Supabase run. Migrations 0003/0004 marked PROPOSED pending approval.

## Enquiry form ✅
`/centres/[slug]` contact form → `enquiries` (+ `email_logs`). RHF+Zod (shared
schema), server re-validation, rate-limited 5/min/IP, dedupe index, typed Result,
success/error states. Verify: `docs/DATABASE_SCHEMA.md` Form 5 SQL.

## Reviews (submit + report) ✅
`/centres/[slug]`: star-rating review form (signed-in non-owners) → `reviews`;
report control → `review_reports`. DB guards: unique one-per-centre, self-review
trigger, `is_verified` only via check-in. Closes the loop with the existing admin
moderation. Verify: `docs/DATABASE_SCHEMA.md` Forms 6 & 7.

## Owner listing CRUD + interactions ✅
Create/edit listing (`/owner/centres`), submit-for-review (draft→pending_review),
image upload to Storage `listing-images` (path `<centreId>/…`, RLS-scoped) →
`listing_images`. Claim (`listing_claims`), save/unsave (`saved_listings` + `/saved`),
check-in/out (`check_ins`, one-open-per-user, powers occupancy). Forms 8–11 mapped.

## Admin claim approval ✅
`/admin/claims` queue → approve (atomic ownership transfer via `approve_claim`,
rejects competing claims, audited) or reject. Closes the claims loop. Migration
0006 (function) — apply after 0001–0005.

## Auth + onboarding ✅
`/login` (password + Google OAuth + magic link), email verification, `/auth/reset`
+ `/auth/update-password`, `/auth/callback` (code exchange → onboarding if new),
`/onboarding` role select (student/owner via `choose_role`). Rate-limited; sign-out
action. Migration 0007.

## Analytics ✅
Vercel Analytics + Speed Insights mounted in root layout (Core Web Vitals).

## Testing (expanded) ✅
Playwright specs: discovery, auth-guard, forms (validation negatives), auth-flow
(routing + reset), seo (robots/sitemap/JSON-LD). Positive + negative per charter.

## Taxonomy pages ✅
`/categories/[slug]` and `/locations/[slug]` (SEO metadata, JSON-LD breadcrumbs,
loading + not-found) over the `taxonomy` service. Feed reuses CentreCard.

## Booking flow ✅
`/centres/[slug]/book` → choose resource + period (hour/day/month) → `bookings`
row (server-priced) → `/book/confirmed`. Closes the 'Book a seat' link. Payment
capture pending (Razorpay). Migration 0008.

## Payments ✅
Razorpay: `startPayment` (server-priced order) → hosted checkout → `confirmPayment`
(signature-verified) → booking paid+confirmed. Idempotent webhook at
`/api/webhooks/razorpay`. Graceful pay-at-centre fallback when unconfigured.
Migration 0009. Runbook: docs/DEPLOYMENT.md.

## Email (Resend) ✅
`lib/email.ts` — real sending via Resend + `email_logs` audit + graceful
queue-only fallback. Enquiry sends sender confirmation + owner notification
(owner email via admin API). HTML-escaped user content.
