# StudyNook — Operations Manual

Disaster recovery, incident response, support, and maintenance procedures.
**Companion:** `DEPLOYMENT-RUNBOOK.md` (deploy + rollback).

---

## 1. Disaster Recovery Plan

### 1.1 Recovery objectives — decide these before you need them

| Metric | Meaning | Recommended | Agreed |
|---|---|---|---|
| **RPO** (Recovery Point Objective) | Maximum acceptable data loss | ≤ 5 min (requires PITR) | ⬜ |
| **RTO** (Recovery Time Objective) | Maximum acceptable downtime | ≤ 1 hour | ⬜ |

Daily backups alone give an RPO of up to 24 hours — meaning a full day of bookings and payments could be lost. **For a platform that takes money, enable Point-in-Time Recovery.** This is a paid Supabase tier and a business decision, but the alternative is explaining lost bookings to paying customers.

### 1.2 Failure scenarios

| Scenario | Impact | Response | Est. recovery |
|---|---|---|---|
| Bad deployment | Site broken, data intact | Runbook §5.2 — promote previous deployment | < 5 min |
| Database down (provider incident) | Total outage | Check Supabase status; no self-service fix; communicate to users | provider-dependent |
| Data corruption from a bug | Wrong/missing data | Pause app → PITR to just before the event → verify → resume | 30–60 min |
| Accidental destructive migration | Schema/data loss | Runbook §5.3 — fix forward, or restore from pre-migration backup | 30–90 min |
| Region outage | Total outage | Supabase/Vercel are single-region by default; multi-region is a cost/complexity decision | hours |
| Payment provider outage | Bookings cannot complete | Bookings remain `pending`/`unpaid` — no data corruption, no false confirmations. Communicate; users retry. | provider-dependent |
| Email provider outage | Notifications undelivered | In-app notifications still work; `email_logs` records failures for replay | provider-dependent |
| Compromised secret | Potential unauthorised access | §3.4 secret rotation, immediately | < 30 min |

**Design note that limits blast radius:** payments are server-priced and the webhook is idempotent with HMAC verification. A payment-provider outage therefore produces *unpaid pending bookings*, not phantom confirmations or double charges. Similarly, an email outage doesn't lose the event — the notification row still exists in the database.

### 1.3 Recovery procedure

1. **Declare** — one named incident owner. Ambiguous ownership is the main cause of slow recovery.
2. **Assess** — check `/api/health`, Vercel logs, Supabase status page. Establish: is data affected, or only availability?
3. **Contain** — if data is being corrupted, pause the application *before* investigating further. Stopping the bleeding beats diagnosis.
4. **Recover** — per §1.2.
5. **Verify** — full smoke test (Runbook §6).
6. **Communicate** — status to users; post-incident summary to stakeholders.
7. **Post-mortem** — blameless; what failed, why, what change prevents recurrence. Record in the incident log.

---

## 2. Incident Response

### 2.1 Severity levels

| Sev | Definition | Response time | Escalate to |
|---|---|---|---|
| **SEV-1** | Site down, payments failing, data loss, security breach | Immediate | Tech Lead + Product Owner |
| **SEV-2** | Major feature broken, no workaround (e.g. booking fails) | < 1 hour | Tech Lead |
| **SEV-3** | Feature degraded, workaround exists | < 1 business day | On-call engineer |
| **SEV-4** | Cosmetic, minor | Next sprint | Backlog |

### 2.2 On-call essentials

- Who is on call, and how are they reached out of hours? ⬜ **define before launch**
- Access required: Vercel, Supabase, Razorpay, Resend, DNS, and the Git repository. A responder without credentials cannot respond.
- **Security incidents:** contain first (rotate secrets, revoke sessions), then investigate. Preserve `audit_logs` — do not delete evidence.

### 2.3 Incident log template

| ID | Date | Sev | Summary | Detected by | Cause | Resolution | Follow-up |
|---|---|---|---|---|---|---|---|

---

## 3. Maintenance Procedures

### 3.1 Routine

| Task | Frequency |
|---|---|
| Review error logs | Weekly |
| Review `audit_logs` for unusual admin activity | Weekly |
| Check `email_logs` for delivery failures | Weekly |
| `ANALYZE` after significant data growth | Monthly |
| Review slow queries (`pg_stat_statements`) | Monthly |
| Dependency updates (security patches first) | Monthly |
| **Restore drill** — restore a backup to a scratch database | Quarterly |
| Review Google Maps API usage/billing | Monthly |

**The restore drill matters.** A backup that has never been restored is an assumption. This was verified once at M19 (0 errors, exact row-count match) — repeat it quarterly against real production data volumes.

### 3.2 Database maintenance
Supabase handles vacuum/autovacuum. After bulk imports or major growth, run `ANALYZE` so the planner has current statistics — index choices degrade with stale stats.

### 3.3 Log retention
Vercel retains logs per your plan. `audit_logs` and `email_logs` grow unbounded — **define a retention policy** (e.g. archive `email_logs` older than 12 months) before the tables become unwieldy. ⬜

### 3.4 Secret rotation

Rotate on any suspicion of compromise, and on staff departure. Order matters:

1. Generate the new secret in the provider dashboard.
2. Update the environment variable in Vercel.
3. Redeploy (env changes need a new deployment to take effect).
4. Verify `/api/health` and a live smoke test.
5. Revoke the old secret **only after** verification.

⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely. If it leaks, treat it as a full data breach: rotate immediately, review `audit_logs`, and assess disclosure obligations.

---

## 4. Support Procedures

### 4.1 Channels
Support email is published on `/contact`. ⬜ **The placeholder address must be replaced with a monitored inbox before launch** — an unmonitored support address is worse than none.

### 4.2 Common request → resolution

| Request | Path |
|---|---|
| Refund | Admin → Bookings → process refund (double-refund is blocked at the DB) |
| Booking dispute | Check `audit_logs` + booking history for the authoritative record |
| Cannot log in | Password reset; verify the account exists and is confirmed |
| Missing confirmation email | Check `email_logs`; the in-app notification is the fallback record |
| Owner wants to claim an existing listing | Admin → Claims |
| Inappropriate review | Admin → Reviews → moderate |
| Account deletion request | Manual process — ⬜ **document a defined procedure**, including what is retained for tax/accounting and what is removed |

### 4.3 Escalation
Support → engineering when: data looks wrong, a payment discrepancy exists, or multiple users report the same fault (that is an incident, not a support ticket — see §2).

---

## 5. Open Operational Items

These are unresolved and belong to the business, not the code:

| # | Item | Owner |
|---|---|---|
| 1 | Define and agree RPO/RTO; enable PITR if RPO < 24h | Product Owner |
| 2 | Name the on-call rota and out-of-hours contact | Tech Lead |
| 3 | Replace the placeholder support email with a monitored inbox | Business |
| 4 | Define the account-deletion procedure | Business/Legal |
| 5 | Define log/data retention policy | Business/Legal |
| 6 | Configure uptime alerting against `/api/health` | DevOps |
| 7 | Add error tracking (see Staging report §7) | Tech Lead |
| 8 | Rehearse the rollback drill on staging | DevOps |
