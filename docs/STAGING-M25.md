# StudyNook — Staging Deployment & Environment Validation (Milestone 25)

**Companion document:** `docs/DEPLOYMENT-RUNBOOK.md` (deployment procedure + rollback plan).

---

## ⚠️ Scope Boundary

M25 is largely infrastructure work: deploying to staging, DNS, SSL, CDN, live third-party integrations, cross-browser testing, monitoring dashboards. **None of that can be performed without hosting access, credentials, and real browsers.** This report does not claim any of it was done.

What it does contain: three genuine gaps found and **built**, and — for the first time in this project — the application **actually run and probed over HTTP**, which verified some things and exposed a real defect.

---

## 1. Gaps Found and Built

| # | Gap | Why it mattered | Status |
|---|---|---|---|
| 1 | **No health check endpoint** | "Health checks operational" is an explicit exit criterion. Uptime monitors had nothing to poll — and polling the homepage is misleading, since it can serve from cache while the database is down. | ✅ built `/api/health` |
| 2 | **No CI pipeline** | Nothing prevented broken code reaching staging. The `@supabase/ssr` defect from M16 is exactly the class of failure CI catches. | ✅ built `.github/workflows/ci.yml` |
| 3 | **No rollback plan** — outstanding since the M16 gate | The single most consequential omission. A production incident with no rollback procedure is an improvised one. | ✅ written (runbook §5) |

---

## 2. ⭐ First Actual Run of the Application

Everything before this milestone was verified by building and by database testing. This is the first time the app was **started and served real HTTP traffic**.

```
GET /                    → 200
GET /api/health          → 503  {"status":"degraded","checks":{"app":"ok","database":"fail"}}
```

The 503 is **correct** — the sandbox has placeholder Supabase credentials, so the database genuinely is unreachable. The endpoint accurately detected and reported it, which is precisely what a readiness probe should do.

### Security headers — verified in a real HTTP response

M20 added security headers; until now they were only verified as *configuration*. Confirmed live on the wire:

| Header | Present |
|---|---|
| `Content-Security-Policy` | ✅ |
| `X-Frame-Options: DENY` | ✅ |
| `X-Content-Type-Options: nosniff` | ✅ |
| `Referrer-Policy: strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | ✅ |
| `Strict-Transport-Security` (2yr, preload) | ✅ |

### Defect found by running it

`latencyMs: 7084` — the health check took **7.1 seconds** to report failure, because the Supabase client retries internally before giving up. Uptime monitors typically time out at 5–10s, so a hung database would have made the probe itself hang and report nothing useful.

**Fixed** by racing the DB probe against a 3-second bound. Re-verified: **3.00s**, HTTP 503, correct JSON.

*This is the third time in this project that running something — rather than reading it — surfaced a defect that review had missed (after the RLS recursion and the `@supabase/ssr` version mismatch).*

---

## 3. Environment Configuration — Validated Behaviour

`lib/env.ts` throws on any missing required variable, so a misconfigured environment **fails at startup rather than running half-broken**. Verified: the app refuses to start without `NEXT_PUBLIC_SUPABASE_URL` et al.

Full variable table, including which are public and which must never be exposed, is in the runbook §2.

---

## 4. Database — Already Validated (M19), Re-confirmed

| Item | Status |
|---|---|
| Migrations execute cleanly on a **fresh** database | ✅ 20/20 (M19) |
| Indexes, functions, triggers, RLS | ✅ 26 tables, all PK + RLS, every FK indexed |
| Backup + restore verified | ✅ `pg_dump` → `pg_restore`, 0 errors, exact row-count match (M19) |
| Seed data | ⬜ must be loaded on the staging project |

---

## 5. Build & Deployment

| Item | Status |
|---|---|
| Clean production build | ✅ `✓ Compiled successfully`, 0 type errors |
| Application startup | ✅ verified — `next start` serves 200 |
| CI/CD pipeline | ✅ **built** (typecheck · lint · test · build on push and PR) |
| Version tagging | ⬜ procedure documented (runbook §9); tag at release |
| Environment isolation | ⬜ **staging and production must use separate Supabase projects** — see runbook §9 |
| Rollback strategy | ✅ documented; ⬜ **drill not yet rehearsed** |

---

## 6. Third-Party Integrations

All require live credentials and cannot be validated here. Code paths are implemented and unit/logic-verified in earlier milestones.

| Integration | Code status | Live validation |
|---|---|---|
| Google OAuth | ✅ implemented | ⬜ needs credentials |
| Google Maps / Places | ✅ implemented | ⬜ needs API key |
| Razorpay (payments + webhook) | ✅ HMAC-verified, idempotent | ⬜ needs **test** keys |
| Resend (email) | ✅ implemented + `email_logs` | ⬜ needs API key |
| Supabase Storage | ✅ MIME/size limits (`0019`) | ⬜ needs project |
| Vercel Analytics | ✅ wired | ⬜ confirm post-deploy |
| **Error tracking** | ❌ **not installed** | see §7 |

---

## 7. On Error Tracking

I deliberately did **not** install Sentry or similar. It adds a dependency, requires an account and DSN, and sends application data to a third party — that is your decision to make explicitly, not mine to make silently on your behalf.

Current error visibility: `console.error` surfaced in Vercel logs, plus `audit_logs` and `email_logs` in the database. Workable at launch scale, but it will not **alert** you — you would find out from a user.

**Recommendation: add error tracking before or shortly after go-live.**

---

## 8. Exit Criteria

| Criterion | Status |
|---|---|
| Staging deployment completed | ⬜ **requires your infrastructure** |
| Production build without blocking errors | ✅ verified |
| Environment variables configured and validated | ✅ validation logic verified; ⬜ set on staging |
| Database migrations executed successfully | ✅ verified on fresh DB (M19); ⬜ run on staging |
| Backup and restore verified | ✅ verified (M19); ⬜ enable PITR on staging |
| Third-party integrations functioning | ⬜ **needs credentials** |
| Authentication flows validated | ✅ logic; ⬜ live OAuth |
| Maps / Places working | ⬜ **needs API key** |
| Search, listings, booking, payment verified | ✅ logic (M18); ⬜ live |
| Dashboards functioning | ✅ logic; ⬜ live |
| Email and notification services validated | ✅ logic; ⬜ needs Resend key |
| HTTPS with valid certificates | ⬜ **hosting-provided**; HSTS header ✅ verified |
| Monitoring, logging, health checks operational | ✅ **health endpoint built + tested**; ⬜ alerting to configure |
| Smoke test completed | ✅ locally (§2); ⬜ on staging |
| No Critical/High defects | ✅ none open |
| **Rollback procedure documented and verified** | ✅ documented; ⬜ **drill not rehearsed** |
| Staging sign-off | ⬜ **yours** |

---

## 9. Verdict

**Everything buildable for M25 is built and tested. The milestone cannot be completed from development** — staging deployment, DNS, SSL, live integrations and cross-browser testing require your infrastructure and credentials.

Three things I'd flag as genuinely important before go-live, in order:

1. **Rehearse the rollback once on staging.** Deploy, roll back, time it, confirm the verification checklist passes. Fifteen minutes. An unexecuted rollback plan is a hypothesis, not a plan.
2. **Separate Supabase projects for staging and production.** Sharing one puts test bookings and test payments in production data, and a staging migration mistake takes production down.
3. **Add error tracking** — otherwise your first notification of a production fault will come from a user.
