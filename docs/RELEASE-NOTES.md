# StudyNook — Release Notes

## v1.0.0 — Initial Release

**Status:** Prepared for release · not yet deployed to production
**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Supabase (Postgres + Auth + Storage) · Razorpay · Resend · Vercel

StudyNook is a directory and booking platform for study spaces in Warangal, Telangana. Students find, compare and book study halls, reading rooms and coworking desks; owners list and manage their spaces; administrators moderate the marketplace.

---

### For Students
- **Search & discovery** — keyword search, filters (area, space type, price, rating, amenities), and location-based "near me" search with distance sorting
- **Centre pages** — photo gallery, amenities, live seat availability, transparent pricing, verified reviews, map, and similar centres
- **Saved centres** — bookmark spaces for later
- **Booking** — hourly, daily or monthly, with real-time availability and instant confirmation
- **Payments** — secure checkout via Razorpay; automatic invoice generation (`SN-YYYY-NNNNNN`)
- **Manage bookings** — history, cancellation, rescheduling, and invoice download
- **Reviews** — rate and review centres you've used
- **Notifications** — in-app notification centre plus email for booking, payment and cancellation events
- **Waitlist** — join when a space is full; automatic promotion when a seat frees up

### For Centre Owners
- **Guided onboarding** with Google Places import to auto-fill business details
- **Centre management** — details, photos, amenities, opening information
- **Resources & pricing** — configure rooms/desks with per-period pricing
- **Bookings & calendar** — see and manage all bookings across your centres
- **Customers** — view the students who have booked with you
- **Revenue dashboard** — bookings, occupancy and monthly revenue
- **Enquiries** — receive and respond to student enquiries

### For Administrators
- **Centre moderation** — approve or reject listings with reasons
- **User management** — view users and change roles (with a last-admin safeguard)
- **Bookings & payments** — full oversight, refund processing, CSV export
- **Review moderation** — handle reported reviews
- **Listing claims** — process ownership claims for existing listings
- **Waitlist oversight**
- **Audit log** — a record of every sensitive action, with actor and timestamp

---

### Engineering Highlights

- **Concurrency-safe booking.** Seat allocation is an atomic `SECURITY DEFINER` Postgres function. Verified under load: 60 simultaneous booking attempts produced zero overbooking and zero deadlocks.
- **Defense-in-depth security.** Row-Level Security on all 26 tables *and* application-layer role guards. Penetration testing confirmed IDOR, privilege escalation and SSRF are blocked. OWASP Top 10 reviewed — all categories pass.
- **Server-side pricing.** Prices are calculated server-side at booking time; the client cannot influence the amount charged.
- **Idempotent payment webhooks.** HMAC-SHA256 signature verification with timing-safe comparison, plus event de-duplication — replayed webhooks cannot double-process.
- **Performance.** 102 kB shared First Load JS; all hot database queries execute in under 1 ms; 70% of components are Server Components.
- **Accessibility.** WCAG 2.2 AA implementation with computed contrast compliance across light and dark themes.
- **SEO.** Dynamic sitemap, structured data (Organization, WebSite/SearchAction, LocalBusiness, BreadcrumbList), canonical URLs, and full social metadata.

---

### Known Limitations in v1.0.0

Stated plainly so expectations are set correctly:

| Item | Note |
|---|---|
| **Compare centres** | Not implemented — deferred to a future release |
| **Admin CMS** | Not implemented — scope was never defined |
| **Email template management** | Templates are code-level, not admin-editable |
| **Admin system settings** | Not implemented |
| **Blog / FAQ / Help Centre** | Out of scope for v1 — v1 is a booking product, not a content site |
| **Multi-factor authentication** | Supported by Supabase but not enabled |
| **Error tracking** | Not installed — recommended before or shortly after launch |
| **Legal copy** | `/privacy` and `/terms` contain **placeholder text requiring completion and legal review** |

---

### Deployment Requirements

Before this release can go live:
- Supabase project provisioned; migrations `0001`–`0020` applied
- Razorpay, Resend, Google OAuth and Google Maps credentials configured
- `CRON_SECRET` set (booking expiry runs every 5 minutes)
- **Legal copy completed** in `/privacy` and `/terms`
- Support email on `/contact` replaced with a monitored inbox

See `DEPLOYMENT-RUNBOOK.md` for the full procedure and `OPERATIONS.md` for operational readiness.

---

### Database
20 migrations, all additive and idempotent, verified to apply cleanly to a fresh database. 26 tables, 40 foreign keys (all indexed), 54 RLS policies. Backup and restore verified end-to-end.
