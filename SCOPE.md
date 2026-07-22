# SCOPE.md — StudyNook project scope

One page so a developer (and stakeholder) knows exactly what this project is,
what's in it, and where the boundaries are.

## Product
A student-first **directory + marketplace for study spaces** (study halls,
reading rooms, coworking, 24/7, women-safe) in Warangal, Telangana. Students
discover, compare, review, save, check in to, and **book** centres; owners list
and manage them; admins moderate. Think "Google Maps + Airbnb + Zomato for study
spaces," where the moat is a verified student-demand network (verified data,
trust, community, network effects) rather than a copyable booking form.

## Roles
- **Student** — browse, save, enquire, review, check in, book, pay.
- **Owner** — create/edit listings, upload images, submit for review, read enquiries.
- **Admin** — approve/reject/suspend listings, moderate reviews & reports,
  approve ownership claims, view audit log.

## In scope — BUILT
Discovery (search/filter, keyset pagination) · listing detail (SEO, JSON-LD,
status-gated visibility) · categories & locations pages · enquiries · reviews +
reporting · ownership claims · saved listings · check-in / occupancy · owner
listing CRUD + image upload · bookings · Razorpay payments (with pay-at-centre
fallback) · auth (email/password + Google OAuth + magic link + verification +
reset) + onboarding role selection · admin dashboard (approvals, moderation,
claims, audit) · SEO (sitemap, robots, JSON-LD) · rate limiting · email (Resend)
· analytics · sample data · full test scaffolding.

**14 storable forms**, each mapped to its database table/column with verification
SQL in `docs/FORM_TO_DB_MAPPING.md`.

## Database
- **Primary (the app runs on this): Supabase / PostgreSQL** — `supabase/migrations/`
  (0001–0009) + `supabase/seed.sql`. RLS enforces authorization; Postgres
  functions handle atomic multi-table operations; Supabase Auth + Storage.
- **Secondary (schema only): MySQL** — `database/migrations/` + `05-database/`.
  A complete, documented MySQL schema requested by a later spec. **The app is NOT
  wired to MySQL**; using it requires re-platforming the data layer, auth and
  storage. See README "which database?" section.

## Out of scope / deferred (documented, not blockers)
- Multi-org / franchise tenancy (single-owner model).
- OAuth beyond Google (Facebook/Apple/Microsoft).
- Notifications UI (table exists).
- Actual payment capture until Razorpay KYC; live email until Resend domain verified.
- Design-system finalisation (charter specifies Inter/minimal; current brand is
  green/gold — a decision is pending).
- App-on-MySQL re-platform (only if MySQL is chosen over Supabase).

## Definition of done for THIS handoff
Code, schema, seed data, tests, and documentation are complete and internally
consistent. "Live" requires the developer to: create the service accounts, run
the first `npm run build` (expect minor first-run shake-out), apply migrations +
seed, and deploy per `docs/DEPLOYMENT.md`. Those steps need real credentials and
a running environment, so they are the developer's to perform.

## Source specifications
The original briefs this project was built from are in `docs/source-prompts/`:
- `Directory_Website_Project.docx` — original project brief.
- `Directory_Website_Project_Master_Prompt_Updated.docx` — updated master prompt
  (adds the form-to-database verification mandate).
- `CLAUDE-MAIN_PROMPT_Directory_Website.docx` — latest master prompt (adds the
  MySQL schema mandate → `05-database/`).
