# CLAUDE.md — StudyNook project memory

> Read this file fully before writing any code. It is the source of truth for
> how this project is built. Keep it accurate; add updates, never delete history.

## What StudyNook is
A production directory + marketplace for discovering, comparing, reviewing and
booking study spaces (study halls, reading rooms, coworking) — student-first.
Pilot city: Warangal, Telangana. Roles: **student, owner, admin**.

## Tech stack
Next.js (App Router) · React · TypeScript (strict, no `any`) · Tailwind +
shadcn/ui · React Hook Form + Zod · TanStack Query · Supabase (Postgres, Auth,
RLS, Storage, Realtime) · Razorpay · Resend + WhatsApp · Vercel · GitHub.

## Architecture (feature-based)
```
/app        routes, route handlers, sitemap/robots
/features   <feature>/{types,schema,services,hooks,components,actions}.ts
/components/ui   shadcn primitives
/lib        supabase clients, auth/rbac, result, seo, rate-limit, audit, query
/types      database.types.ts (GENERATED — run `npm run db:types`, don't hand-edit)
/supabase/migrations   every schema change, in order
/tests/e2e  Playwright positive + negative specs
/docs       DECISIONS.md, FEATURES.md
```

## Non-negotiables (from the project charter)
- **No prototype code, no mock data** in completed features.
- **No `SELECT *`** in production queries — select explicit columns.
- **Every schema change is a migration.** Never run destructive SQL without approval.
- **RLS on every private table**, plus server-side `requireRole()` (defense in depth).
- **Never trust roles from the browser.** Role lives in `profiles.role`, checked in RLS + server.
- **Never expose** service-role key, secrets, or stack traces to the client.
- **Validate every input** with Zod at the boundary (Server Action / Route Handler).
- **Every page** has loading / empty / error / not-found states; responsive; WCAG 2.2 AA.
- **SEO:** approved public pages indexable; dashboards/admin/account/drafts `noindex`.
- **Listings require admin approval** before going public (status lifecycle below).
- **Form-to-DB verification (mandatory):** no form is "complete" until data is
  submitted in the browser AND visible in Supabase Table Editor / SQL Editor.
  Every database-backed form must be documented in `docs/FORM_TO_DB_MAPPING.md`
  (field→column) and `docs/DATABASE_SCHEMA.md` (verification SQL + ERD). Schema
  changes require an approved blueprint (inventory → mapping → schema →
  relationships → RLS matrix → migration plan → verification plan → tests) BEFORE
  any migration is applied.

## Listing lifecycle
`draft → pending_review → approved → rejected → suspended → archived`
`centres.status` is authoritative; `is_published` is kept in sync by a trigger
(`is_published = status = 'approved'`). Only approved centres are public / in the sitemap.

## Established patterns (copy these)
- **Reference slice:** `features/centres/*` is the template every feature follows
  (types → Zod schema → service with keyset pagination → route handler/action →
  TanStack hook → components with all states).
- **Server Actions** return `Result<T>` (never throw across RSC). Use the
  `action(schema, raw, run)` wrapper in `lib/auth/action.ts`.
- **Pagination** is keyset (not OFFSET) for feeds — see `centres.service.ts`.
- **Auditing:** call `logAudit()` for admin/security-sensitive actions.
- **Rate limiting:** wrap auth/search/forms/webhooks with `rateLimit()`.

## Applicability decisions (charter items scoped for StudyNook)
- **Excluded:** organisations / multi-org tenancy (centres are single-owner).
- **Deferred:** Facebook/Apple/Microsoft OAuth (Google only for now).
- **Process-only (not code):** UI mockup versioning.

## Setup / env
See `.env.example`. Then: `npm i` → `npm run db:push` → `npm run db:types` → `npm run dev`.
Manual steps live in `docs/FEATURES.md` per feature (OAuth redirect URLs, Razorpay
KYC, Resend domain, WhatsApp templates, Storage buckets).
