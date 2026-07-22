# QA Scope Map — ReadHub test plan vs. StudyNook as built

The uploaded QA plan (`STUDYROOM.docx`) is written for **"ReadHub"**, a broader
product than StudyNook. Running its ~500 scenarios verbatim against StudyNook
produces a large number of "failures" that are **not defects** — they test
features that were never in StudyNook's scope.

This map separates the plan into three buckets so a tester knows what to
actually execute.

Ground truth (verified against the repo): **27 pages · 57 server actions ·
5 API routes · 23 tables · 11 migrations**.

---

## Bucket A — IN SCOPE (execute these)

These map to features that exist. They are the real QA surface.

| Module | Scenarios that apply | Where it lives |
|---|---|---|
| Authentication | register (email), login, invalid password, invalid email, logout, password reset, expired reset link, Google OAuth, OAuth profile completion, role assignment, unauthorized page access, protected routes, multiple sessions | `features/auth/*`, `/login`, `/auth/reset`, `/auth/update-password`, `/onboarding` |
| RBAC | student/owner/admin boundaries, admin-only pages, owner-only console, guest redirects | `lib/auth/rbac.ts`, all `/admin/*`, `/owner/*` |
| Centre onboarding | create centre, edit, business name, description, character limits, address, opening hours, pricing, amenities, resources/rooms, capacity validation, cover image, gallery upload, invalid format, large file, submit for review, approve, reject, publish | `/owner/centres/new`, `/owner/centres/[id]`, `createCentre`, `updateCentre`, `submitForReview`, `moderateCentre` |
| Listings | create, edit, publish, unpublish, archive, restore, SEO slug, duplicate slug, ownership validation, audit logging, images, pricing | `features/centres/*`, `features/admin/actions.ts` |
| Search | keyword, area/location, category, filters (price, rating, space type, women-safe), sort, pagination (keyset), infinite scroll, no results, partial keyword, malformed input | `/centres`, `/api/centres`, `centres.service.ts` |
| Centre detail | detail render, JSON-LD, resources, reviews, occupancy, unpublished not visible, unknown slug → 404 | `/centres/[slug]` |
| Reviews & ratings | submit review, self-review blocked, rating aggregation, report review, admin moderation | `features/reviews/*`, `/admin/reviews` |
| Booking engine | availability, capacity, double-booking guard, concurrency, waitlist join, queue position, promotion, confirmation, cancellation, reschedule, check-in, check-out, no-show, expiry (cron) | `features/bookings/*`, migrations 0010–0011, `/api/cron/expire-bookings` |
| Payments | successful payment, failed payment, webhook verification, webhook retry/idempotency, refund, partial refund, duplicate refund prevention, amount tampering | `features/payments/*`, `refund.actions.ts`, `/api/webhooks/razorpay` |
| Dashboards | student (`/account`), owner (`/owner`, `/owner/bookings`), admin (`/admin`, `/admin/bookings`, `/admin/waitlist`, `/admin/claims`, `/admin/reviews`, `/admin/audit`) — widgets, search, filters, permissions | as listed |
| Exports | CSV export, Excel (.xlsx) export, filtered results only, headers, statuses included | `/api/admin/bookings/export`, `/api/owner/bookings/export` |
| Notifications | in-app + email for created / confirmed / cancelled / refunded / rescheduled / waitlist promoted / completed / no-show; read status | `features/notifications/notify.ts` |
| Security | SQL/PostgREST injection, XSS, IDOR, broken authz, RLS, rate limiting, webhook security, upload validation, secrets, audit logs | cross-cutting |
| SEO | metadata, canonical, OG, Twitter, JSON-LD, sitemap, robots | `app/layout.tsx`, `lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` |
| Accessibility | keyboard nav, ARIA, labels, focus, contrast, responsive | cross-cutting |
| Enquiries | submit enquiry, validation, owner inbox | `features/enquiries/*`, `/owner/enquiries` |
| Claims | submit claim, admin approve/reject | `features/claims/*`, `/admin/claims` |
| Saved | save/unsave centre, saved list | `features/saved/*`, `/saved` |
| Check-ins | check in, check out, occupancy | `features/checkins/*` |

---

## Bucket B — NOT IN SCOPE (do not raise as defects)

Verified absent from the codebase. These are ReadHub features StudyNook never
had. Testing them yields false failures.

- Google Places / Google Business autofill; map pin accuracy
- Compare centres
- Coupons, vouchers, promo codes, discounts
- Invoices, receipts, taxes/GST/VAT
- MFA / two-factor; CAPTCHA; phone verification; email change
- Account deletion / reactivation; session timeout / idle timeout
- Saved search, recent search, search history
- Bulk updates; gallery reordering; duplicate-centre detection
- Social media URLs (Facebook/Instagram/LinkedIn/YouTube/TikTok/X)
- Document uploads (licence, ID, proof of address)
- Booking reminders (no scheduler for reminders)
- Newsletter; contact-form email; system-alert emails
- Analytics charts, CMS, Invoices page, Reports page
- Calendar view, advanced user-management page
- Maintenance page, custom 500 page
- Push notifications; notification preferences
- Holidays, house rules, cancellation-policy editor
- University search, postcode search, radius search
- "Remember me", account lockout, JWT refresh-token rotation (handled by Supabase)

---

## Bucket C — ALREADY AUTOMATED

Existing specs (`npm run test`, `npm run test:e2e`):

| File | Covers |
|---|---|
| `tests/unit/booking-export.test.ts` | **(new)** CSV headers/escaping/dates, xlsx parse, numeric amounts, auto-sized columns, empty sets — imports the real module |
| `tests/unit/security-invariants.test.ts` | **(new)** search injection strip, role-escalation guard, capacity/promotion guard, exactly-once confirm, status-transition guard |
| `tests/unit/booking-lifecycle.test.ts` | reschedule ordering, partial-refund detection, cancel cutoff |
| `tests/unit/razorpay.test.ts` | signature HMAC stability |
| `tests/unit/result.test.ts` | Result/ActionError helpers |
| `tests/unit/format.test.ts` | INR formatting |
| `tests/e2e/auth-flow.spec.ts` | login page, session-required redirects, reset without enumeration |
| `tests/e2e/auth-guard.spec.ts` | logged-out cannot reach owner/admin; admin API rejects anon |
| `tests/e2e/discovery.spec.ts` | browse → detail, unknown slug, malformed params |
| `tests/e2e/forms.spec.ts` | enquiry validation, non-uuid centreId rejected |
| `tests/e2e/seo.spec.ts` | robots, sitemap, JSON-LD |

---

## Bucket D — REQUIRES LIVE INFRASTRUCTURE

In scope, but **cannot** be executed without provisioned services. These are the
scenarios that must be run manually (or in CI) after deployment:

- Google OAuth round-trip (needs Google client + callback)
- Real payment success/failure/retry (needs Razorpay test mode)
- Webhook delivery, retry, signature rejection (needs public URL)
- Email delivery, links, branding (needs Resend domain)
- Booking concurrency / double-booking under load (needs live DB + load tool)
- Storage upload: invalid format, large file, owner-scoped access (needs bucket)
- Cron expiry firing on schedule (needs Vercel Cron + `CRON_SECRET`)
- Lighthouse / Core Web Vitals / cross-browser / mobile responsive
- RLS enforcement end-to-end (policies verified statically; live proof needs DB)

---

## How to use this

1. Ignore Bucket B entirely — those aren't bugs.
2. Bucket C runs today: `npm run test` (once deps install).
3. Bucket A minus C is your **manual/automation backlog**.
4. Bucket D is the post-deploy smoke checklist.
