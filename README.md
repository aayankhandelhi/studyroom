# StudyNook

A directory and booking platform for study spaces in Warangal, Telangana. Students search, compare and book study halls, reading rooms and coworking desks; owners list and manage their spaces; administrators moderate the marketplace.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) · React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS · shadcn/ui |
| Database / Auth / Storage | Supabase (PostgreSQL, RLS) |
| Payments | Razorpay |
| Email | Resend |
| Hosting | Vercel |

**The database is PostgreSQL via Supabase.** All data access, authentication, storage and Row-Level Security assume it. Schema lives in `supabase/migrations/` (20 migrations, additive and idempotent).

---

## Quick start

```bash
# 1. Install (requires Node 20+)
npm ci

# 2. Environment — copy and fill in every key
cp .env.example .env.local

# 3. Database — link your Supabase project, apply schema, generate types
npx supabase link --project-ref <your-project-ref>
npm run db:push
npm run db:types

# 4. Sample data (optional but recommended for local development)
psql "<your-connection-string>" -f supabase/seed.sql

# 5. Run
npm run dev
```

Open http://localhost:3000

> **Note:** `npm run db:types` regenerates `types/database.types.ts` from your linked project. Run it after any migration — the committed file is a starting point, and the CLI is the source of truth.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run db:push` | Apply migrations to the linked project |
| `npm run db:types` | Regenerate database types |

---

## Project layout

```
app/            Routes, layouts, API handlers (App Router)
components/     Shared UI (shadcn/ui + site header/footer)
features/       Business logic by domain — each with
                types · schema (Zod) · services · actions · components
lib/            Cross-cutting: supabase clients, auth/RBAC, env, email, seo
types/          Generated database types
supabase/       migrations/ (20) · seed.sql · config.toml
scripts/        Operational SQL (soft-launch KPIs)
tests/          Unit and E2E tests
docs/           Architecture, audits, runbooks, release notes
```

**Architectural conventions worth knowing before you change anything:**

- Server Actions return a `Result<T>` discriminated union and throw typed `ActionError`s — they don't throw raw exceptions to the client.
- Data access lives in `features/<domain>/services/`. Components never query the database directly.
- Anything requiring atomicity (booking a seat, refunds, role changes, waitlist promotion) is a `SECURITY DEFINER` Postgres function, not application logic.
- Security is defense-in-depth: RLS on all 26 tables **and** application-layer role guards.
- Prices are calculated server-side at booking time. The client cannot influence the amount charged.

---

## Environment variables

See `.env.example` — every variable is documented there. `lib/env.ts` validates required variables at startup and throws if any are missing, so a misconfigured environment fails immediately rather than misbehaving silently.

⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely. Server-side only — never expose it to the client.

---

## Deployment

Full procedure, rollback plan and operational runbook:

| Document | Contents |
|---|---|
| `docs/DEPLOYMENT-RUNBOOK.md` | Deploy procedure, environment config, **rollback plan**, backup/restore |
| `docs/OPERATIONS.md` | Disaster recovery, incident response, support, maintenance |
| `docs/RELEASE-NOTES.md` | v1.0.0 features and **known limitations** |
| `docs/PRODUCTION-READINESS-M26.md` | Go/No-Go assessment and path to launch |

**Before deploying, read `docs/RELEASE-NOTES.md` § Known Limitations.** In particular:

- `/privacy` and `/terms` contain **placeholder legal text requiring completion and legal review**
- The support email on `/contact` is a placeholder and must become a monitored inbox
- Error tracking (Sentry or equivalent) is not installed

---

## Documentation

`docs/` contains the full audit trail: system audit, functional QA, database validation, security audit (OWASP), performance, SEO, accessibility, UAT plan, staging validation, production readiness, and soft launch plan. `docs/RELEASE-FREEZE.md` is the running change log for every milestone.

---

## Testing

```bash
npm test          # 50 unit tests
npm run test:e2e  # Playwright (requires a running instance)
```

---

## Note on a previously included MySQL schema

Earlier revisions of this repository contained a second, standalone **MySQL** schema under `database/` — a reference schema that the application never used.

**This has been resolved: the project is PostgreSQL/Supabase only.** The MySQL schema was removed during the M17 system audit because it duplicated and contradicted the live schema, was unreferenced by any configuration, and is no longer part of the design. No action is required — `supabase/migrations/` is the single source of truth for the database.
