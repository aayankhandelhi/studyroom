# StudyNook — Soft Launch Plan & Monitoring Framework (Milestone 27)

---

## 1. Status: Soft Launch Cannot Begin Yet

Every M27 test scenario begins with *"Test Live…"* — they require the application **running in production with real users**. That situation does not exist:

- **M26 returned NO-GO** — production readiness was not approved
- The application has **never been deployed** to any environment
- No infrastructure, credentials, or real users exist

I will not fabricate uptime figures, error rates, conversion metrics or user feedback. **This document is therefore the Soft Launch *Plan*, not a Soft Launch *Report*.** The report is written by your team during the actual launch, using the framework and the tested queries provided here.

**Dependency chain:** M24 (UAT) → M25 (staging) → M26 (GO) → **M27 (soft launch)**. The first three are outstanding.

---

## 2. ⛔ Readiness Gap — Six Support Scenarios Have No Feature

Same problem the UAT plan flagged: scenarios listed for testing that nothing implements.

| Scenario | Reality |
|---|---|
| **Test Contact Us Form** | `/contact` is a **static page with mailto links** — there is no form to submit |
| **Test Support Ticket Creation** | Not built |
| **Test User Feedback Submission** | Not built |
| **Test Bug Report Submission** | Not built |
| **Knowledge Base** | Not built |
| **FAQ accuracy** | No FAQ page exists |
| **Test Google Analytics Tracking** | **Vercel Analytics** is installed, not Google Analytics — GA-specific tests will fail |
| **Test Live Compare Centres** | Still not built (flagged at M22 and M24) |

**Decision required before soft launch.** Two viable paths:

- **Path A (recommended for a soft launch):** use email + a shared inbox for feedback and bug reports. A soft launch cohort is small; a ticketing system is over-engineering at this stage. Replace the placeholder support address with a monitored inbox and route everything there.
- **Path B:** build a feedback/bug-report form before launching. Roughly a day of work — the `enquiries` feature already provides a close pattern to copy.

Either way, **the placeholder support email must become a real monitored inbox** — that is non-negotiable for a launch.

---

## 3. Soft Launch Design

### 3.1 Cohort

| Group | Suggested size | Purpose |
|---|---|---|
| Study centre owners | 5–10 | Real listings, real availability — without supply there is nothing to book |
| Students | 30–50 | Genuine booking and payment behaviour |
| Internal stakeholders | 3–5 | Business-workflow validation |

**Onboard owners first.** Students arriving to an empty marketplace produce useless data and a bad first impression.

### 3.2 Duration
**Minimum 2 weeks.** It must include at least two weekends and one full billing/booking cycle — weekday and weekend study patterns differ substantially, and a monthly booking's lifecycle needs time to reveal problems.

### 3.3 Monitoring cadence

| Frequency | Activity |
|---|---|
| Continuous | Uptime monitor polling `/api/health` |
| Daily | Error logs · payment success rate · email delivery failures · stuck payments (KPI query 5) |
| Every 2–3 days | Full KPI run (`scripts/soft-launch-kpis.sql`) · direct user check-ins |
| Weekly | Business KPI review with stakeholders · issue triage |

---

## 4. KPI Framework

**Tested queries:** `scripts/soft-launch-kpis.sql` — 14 queries covering acquisition, onboarding funnel, bookings, payments, stuck payments, revenue, email health, notifications, reviews, demand, waitlist pressure, admin activity, and database growth. **All verified to execute against the real schema.**

### 4.1 Thresholds

Set targets with the Product Owner before launch; these are starting points, not agreed SLAs.

| KPI | Healthy | Investigate | Escalate |
|---|---|---|---|
| Uptime | ≥ 99.5% | < 99.5% | < 99% |
| **Payment success rate** | ≥ 95% | < 95% | **< 90% — SEV-1** |
| Email delivery success | ≥ 98% | < 98% | < 95% |
| Booking → payment completion | ≥ 80% | < 70% | < 50% |
| Cancellation rate | < 10% | > 15% | > 25% |
| Stuck unpaid bookings (>1h) | ~0 | rising trend | sharp spike |
| Error rate | < 0.1% of requests | > 0.5% | > 1% |
| API p95 latency | < 500 ms | > 1 s | > 3 s |

⚠️ **Payment success rate is the single most important metric.** Every point below ~95% is real revenue lost and real user frustration, and it is the earliest signal of a gateway or webhook problem.

### 4.2 Business KPIs

| Metric | Why |
|---|---|
| Owner activation (listed → approved → first booking) | Supply-side health |
| Student activation (registered → first booking) | Demand-side conversion |
| Repeat booking rate | The clearest signal of genuine product-market fit |
| Search → detail → booking funnel | Where users drop off |
| Average booking value / revenue per centre | Unit economics |

---

## 5. Abort Criteria — When to Stop the Soft Launch

Agree these **before** launch, while everyone is calm. Deciding mid-incident produces bad decisions.

**Immediate rollback (Runbook §5.2):**
- Payment success rate < 50%, or any evidence of **double charging**
- Data loss or corruption
- Security breach or data exposure
- Site unavailable > 15 minutes with no identified fix

**Pause new signups, keep existing users:**
- Payment success 50–80%
- Critical journey broken with no workaround
- Repeated failures of the same workflow across multiple users

**Continue with a fix-forward:**
- Isolated bugs with workarounds
- Cosmetic or single-feature issues
- Performance degradation within tolerance

**Name the person authorised to make the abort call, before launch.** ⬜

---

## 6. Feedback Collection

Given no in-app feedback exists (§2), for the soft launch cohort:

1. **Direct outreach** — a short call or message to every owner and a sample of students at week 1 and week 2. For a cohort this size, direct contact yields far more than a form would.
2. **Monitored support inbox** — published on `/contact`.
3. **Short survey** at the end — 5 questions maximum.
4. **Behavioural data** — the funnel queries reveal where users abandon, which is often more honest than what they report.

**Questions worth asking:** Did you find a space that suited you? Was anything confusing during booking? Did payment feel trustworthy? What stopped you booking again? Owners: was onboarding clear, and are the bookings you receive accurate?

---

## 7. Issue Register Template

| ID | Date | Severity | Area | Description | Affected users | Status | Resolution |
|---|---|---|---|---|---|---|---|

Severity uses the SEV-1→4 scale in `OPERATIONS.md` §2.1.

---

## 8. Pre-Soft-Launch Checklist

| # | Item | Owner |
|---|---|---|
| 1 | M24 UAT executed and signed off | QA / Business |
| 2 | M25 staging deployed and validated | DevOps |
| 3 | M26 production readiness re-run → **GO** | All |
| 4 | Production deployed; smoke test passed | DevOps |
| 5 | **Legal copy completed** in `/privacy` and `/terms` | Business/Legal |
| 6 | Support inbox monitored (§2) | Business |
| 7 | Uptime monitor polling `/api/health` | DevOps |
| 8 | Error tracking installed | Tech Lead |
| 9 | PITR enabled; RPO/RTO agreed | DevOps |
| 10 | Rollback drill rehearsed | DevOps |
| 11 | Razorpay **live** keys configured and test-charged once | DevOps |
| 12 | Abort-decision owner named | Product Owner |
| 13 | KPI thresholds agreed (§4.1) | Product Owner |
| 14 | Cohort recruited; owners onboarded first | Business |

---

## 9. Soft Launch Report Template (your team completes during launch)

> **Period:** ______ to ______ · **Cohort:** ___ owners, ___ students
>
> | Metric | Target | Actual | Status |
> |---|---|---|---|
> | Uptime | | | |
> | Payment success rate | | | |
> | Email delivery | | | |
> | Bookings completed | | | |
> | Critical incidents | 0 | | |
> | High-severity defects open | 0 | | |
>
> **Top user feedback themes:** ______
> **Issues resolved:** ___ · **Outstanding:** ___
>
> | Role | Name | Approve public launch | Date |
> |---|---|---|---|
> | Product Owner | | ⬜ | |
> | Operations/DevOps | | ⬜ | |
> | Business Stakeholder | | ⬜ | |

---

## 10. Risk Assessment for Soft Launch

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Too few owners → students see an empty marketplace | **High** | High | Onboard owners 1–2 weeks ahead of students |
| 2 | First live payment fails (config, not code) | Medium | High | Make one real low-value test charge before inviting the cohort |
| 3 | Emails land in spam | **High** | Medium | Configure SPF/DKIM/DMARC on the sending domain before launch |
| 4 | No error tracking → faults reported by users | High | Medium | Install before launch |
| 5 | Feedback not captured (no in-app mechanism) | High | Medium | Direct outreach (§6) |
| 6 | Cohort too polite to report problems | Medium | Medium | Ask specific questions, and trust the funnel data over the reports |
| 7 | Live Maps/Places billing surprise | Medium | Medium | Set API quotas and billing alerts |

⚠️ **Risk 3 deserves particular attention.** Booking confirmations landing in spam looks identical to a broken booking system from the user's side. **Configure SPF, DKIM and DMARC on your sending domain before the first email goes out.**

---

## 11. Verdict

**Soft launch cannot start.** It depends on M24, M25 and M26, all of which are outstanding — and it fundamentally requires a live production system with real users.

**Delivered here:** the soft launch plan, cohort design, monitoring cadence, KPI thresholds, abort criteria, feedback strategy, risk assessment, report templates, and **14 tested KPI queries** ready to run against production on day one.

The two things most likely to spoil an otherwise sound soft launch are not code defects: **an empty marketplace** (owners not onboarded first) and **confirmation emails going to spam** (DNS records not configured). Both are addressed in §10 and are worth handling before anything else.
