# StudyNook — UAT Test Plan & Readiness Assessment (Milestone 24)

**Purpose:** Give business users an executable plan to validate StudyNook against business requirements, and flag — before testing starts — which listed scenarios have no working feature behind them.

---

## ⚠️ What This Document Is, And Is Not

**UAT cannot be executed by the development side.** It is by definition *real business users* validating the product against their expectations, then formally signing off. Specifically, the following M24 deliverables **must be produced by your team, not by me**:

- UAT Test Execution Report (results of humans running the scripts)
- User Feedback Report
- Screenshots & Evidence
- UAT Sign-off Document
- Business Approval Report
- Product Owner approval to release

**What this document provides:** the UAT Test Plan, the readiness assessment, test scripts ready to execute, and templates for the defect log and sign-off. Fabricating execution results or a business approval would be worthless and misleading — so this plan is the deliverable, and the results belong to your testers.

---

## 1. ⛔ Readiness Assessment — Read Before Scheduling UAT

I checked every listed scenario against the actual codebase. **Four scenarios reference features that do not exist.** If testers meet these cold, they will log them as Critical defects and UAT will stall.

| Scenario | Status | Recommendation |
|---|---|---|
| **Test Compare Study Centres** | ❌ **not built** — no `/compare` route; "compare" appears only in marketing copy | Descope from UAT, or build first. Not a defect — it was never implemented. |
| **Test CMS Management** | ❌ **not built** — deliberately descoped at M11 (6/7), never defined | Descope, or define scope and build in v1.1 |
| **Test Email Template Management** | ❌ **not built** — email templates are code-level, not admin-editable | Descope for v1 |
| **Test System Settings** | ❌ **not built** — no admin settings page | Descope for v1 |

**Everything else is built and testable.** Verified present: registration/login/reset, search + filters + nearby, centre detail, **saved/favourites** (route `/saved`), booking, cancellation, reschedule, payment, invoice, reviews, notifications, profile; owner onboarding, Google Places import, image upload, rooms/resources, pricing, calendar, **revenue metrics** (on `/owner`), customers, enquiries; admin centres approve/reject, users, bookings, refunds, review moderation, claims, waitlist, audit log, dashboard stats.

**Decision needed from the Product Owner before UAT begins:** confirm the four items above are descoped for v1, and remove them from the UAT scope sheet.

---

## 2. Prerequisites (must be complete before UAT starts)

UAT requires the application **deployed to a staging environment with real services**. It cannot run against a local sandbox.

| Prerequisite | Owner | Status |
|---|---|---|
| App deployed to staging | Dev/DevOps | ⬜ |
| Supabase project provisioned, migrations applied (`0001`–`0020`) | Dev | ⬜ |
| Razorpay **test-mode** keys configured | Dev | ⬜ |
| Resend API key (transactional email) | Dev | ⬜ |
| Google OAuth credentials | Dev | ⬜ |
| Google Maps/Places API key | Dev | ⬜ |
| `CRON_SECRET` set | Dev | ⬜ |
| **Legal copy completed** in `/privacy` and `/terms` (see M22 §12) | Business/Legal | ⬜ |
| Seed data: ≥6 approved centres across ≥2 areas, with resources & pricing | Dev | ⬜ |
| Test accounts created (see §3) | Dev | ⬜ |
| Testers briefed; defect log shared | QA Lead | ⬜ |

⚠️ **Use Razorpay test mode.** Do not run payment UAT against live keys.

---

## 3. Test Accounts

| Role | Purpose |
|---|---|
| Student A | Primary booking journey |
| Student B | Concurrency/second-user checks, review by a different author |
| Owner A | Owns ≥2 approved centres |
| Owner B | New owner — tests onboarding from scratch |
| Admin | Approvals, moderation, refunds |

---

## 4. Test Scripts

**How to record results:** for each step mark **Pass / Fail / Blocked**, and for any Fail capture a screenshot plus the defect ID from §7.

### 4.1 Student Journey (UAT-S)

| ID | Scenario | Steps | Expected Result | Result |
|---|---|---|---|---|
| S-01 | Registration | Sign up with a new email | Account created; verification email received | ⬜ |
| S-02 | Email verification | Click the emailed link | Account verified; signed in | ⬜ |
| S-03 | Onboarding | Complete role/profile prompts | Routed to intended destination | ⬜ |
| S-04 | Login | Sign out, sign back in | Session restored | ⬜ |
| S-05 | Forgot password | Request reset; follow link; set new password | New password works | ⬜ |
| S-06 | Profile update | Change name/phone; save | Change persists after reload | ⬜ |
| S-07 | Search | Search by keyword | Relevant centres returned | ⬜ |
| S-08 | Filters | Apply area, type, price, rating filters | Results narrow correctly; URL reflects filters | ⬜ |
| S-09 | Nearby search | Allow location; use "near me" | Centres sorted by distance | ⬜ |
| S-10 | Map | View map on search/detail | Map renders; markers correct | ⬜ |
| S-11 | Centre detail | Open a centre | Gallery, amenities, pricing, reviews, similar centres, map all display | ⬜ |
| S-12 | Save favourite | Save a centre; open `/saved` | Centre appears in saved list | ⬜ |
| S-13 | Booking | Select resource, period, time; confirm | Booking summary correct; price matches listing | ⬜ |
| S-14 | Payment | Pay with Razorpay **test** card | Payment succeeds; booking confirmed | ⬜ |
| S-15 | Confirmation | Review confirmation screen | Booking details + invoice number shown | ⬜ |
| S-16 | Booking email | Check inbox | Confirmation email received | ⬜ |
| S-17 | Invoice | Open invoice from account | Invoice renders with correct amount + number | ⬜ |
| S-18 | Booking history | Open account bookings | Booking listed with correct status | ⬜ |
| S-19 | Cancellation | Cancel a booking | Status → cancelled; notification received | ⬜ |
| S-20 | Reschedule | Reschedule a booking | New time saved; original linked | ⬜ |
| S-21 | Review | Submit a review for a visited centre | Review appears; rating updates | ⬜ |
| S-22 | Duplicate review | Try reviewing the same centre twice | Blocked with a clear message | ⬜ |
| S-23 | Notifications | Open notification centre; mark all read | Events listed; read state persists | ⬜ |
| S-24 | Logout | Sign out | Session cleared; private pages inaccessible | ⬜ |

### 4.2 Centre Owner Journey (UAT-O)

| ID | Scenario | Steps | Expected Result | Result |
|---|---|---|---|---|
| O-01 | Registration | Sign up as owner | Owner account created | ⬜ |
| O-02 | Onboarding | Complete centre onboarding wizard | Centre saved as draft/pending | ⬜ |
| O-03 | Google Places import | Search and select the business | Name/address/coords auto-filled | ⬜ |
| O-04 | Images | Upload centre photos | Images upload and display; invalid types rejected | ⬜ |
| O-05 | Rooms/resources | Add resources with capacity | Resources saved | ⬜ |
| O-06 | Pricing | Set hourly/daily/monthly pricing | Pricing shows correctly on the public listing | ⬜ |
| O-07 | Submit for review | Submit the centre | Status → pending review | ⬜ |
| O-08 | Approval visibility | After admin approves | Centre appears in public search | ⬜ |
| O-09 | Edit details | Change details on a live centre | Changes reflected publicly | ⬜ |
| O-10 | Availability | Adjust availability/unit counts | Booking availability updates | ⬜ |
| O-11 | Receive booking | Have Student A book | Booking appears in owner bookings | ⬜ |
| O-12 | Calendar | Open owner calendar | Booking shown on correct date | ⬜ |
| O-13 | Customers | Open customers list | Student listed with booking count | ⬜ |
| O-14 | Revenue | View owner dashboard | Bookings, occupancy, monthly revenue correct | ⬜ |
| O-15 | Enquiries | Receive and open an enquiry | Enquiry visible | ⬜ |
| O-16 | Notifications | Check owner notifications | Booking events present | ⬜ |
| O-17 | Isolation | Attempt to view another owner's centre | Access denied | ⬜ |
| O-18 | Logout | Sign out | Session cleared | ⬜ |

### 4.3 Administrator Journey (UAT-A)

| ID | Scenario | Steps | Expected Result | Result |
|---|---|---|---|---|
| A-01 | Login | Sign in as admin | Admin dashboard loads | ⬜ |
| A-02 | Dashboard | Review overview stats | Counts match reality | ⬜ |
| A-03 | Approve centre | Approve a pending centre | Status → approved; becomes public | ⬜ |
| A-04 | Reject centre | Reject with a reason | Status → rejected; owner notified with reason | ⬜ |
| A-05 | Manage users | Open users; change a role | Role updated; user's access changes | ⬜ |
| A-06 | Last-admin guard | Try removing the only admin role | Blocked with clear error | ⬜ |
| A-07 | Manage bookings | Open bookings; filter | Bookings listed and filterable | ⬜ |
| A-08 | Export | Export bookings | File downloads with correct data | ⬜ |
| A-09 | Refund | Process a refund on a paid booking | Refund recorded; student notified | ⬜ |
| A-10 | Double refund | Attempt a second refund on the same booking | Blocked | ⬜ |
| A-11 | Review moderation | Hide/remove a reported review | Review no longer public | ⬜ |
| A-12 | Claims | Process a listing claim | Claim approved/rejected; ownership updated | ⬜ |
| A-13 | Waitlist | Review waitlist entries | Entries listed; promotion works | ⬜ |
| A-14 | Audit log | Open audit log | Sensitive actions recorded with actor + timestamp | ⬜ |
| A-15 | Logout | Sign out | Session cleared | ⬜ |

### 4.4 Business Process / Lifecycle (UAT-B)

| ID | Lifecycle | Expected |
|---|---|---|
| B-01 | Booking lifecycle | pending → confirmed → completed/cancelled, each transition notified |
| B-02 | Payment lifecycle | unpaid → paid → invoice issued; refund path works |
| B-03 | Notification lifecycle | Every booking/payment/moderation event produces a notification |
| B-04 | Email lifecycle | Confirmation, cancellation, approval emails all delivered |
| B-05 | Refund lifecycle | Request → approve → record, no double-refund |
| B-06 | Review lifecycle | Submit → publish → report → moderate |
| B-07 | **Concurrency** | Two testers book the last seat simultaneously; exactly one succeeds |

*B-07 is the highest-value business test — it has passed repeatedly at the database layer (60 concurrent attempts, zero overbooking), but should be confirmed once through the real UI.*

### 4.5 Cross-Platform Matrix (UAT-X)

Run S-07, S-11, S-13, S-14 (search → detail → book → pay) on each:

| Platform | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| Desktop | ⬜ | ⬜ | ⬜ | ⬜ |
| Tablet | ⬜ | — | — | ⬜ |
| Mobile | ⬜ | — | — | ⬜ |

### 4.6 Regression (UAT-R)

| ID | Check |
|---|---|
| R-01 | Previously fixed defects re-verified (see M16–M23 fix log in `RELEASE-FREEZE.md`) |
| R-02 | Core journeys still pass after any UAT fixes |
| R-03 | No new defects introduced by UAT-period changes |

---

## 5. Entry Criteria
UAT starts only when: staging is deployed, all §2 prerequisites are ✅, the four descoped scenarios in §1 are confirmed, and test accounts + seed data exist.

## 6. Exit Criteria (per the milestone)
All scripts executed; **zero Critical and zero High defects open**; Medium/Low triaged and accepted or scheduled; business stakeholders sign off; Product Owner approves release to staging.

---

## 7. Defect Log Template

| ID | Script ID | Severity | Description | Steps to reproduce | Screenshot | Status | Owner |
|---|---|---|---|---|---|---|---|
| D-001 | | Critical/High/Med/Low | | | | Open/Fixed/Accepted | |

**Severity guidance:** *Critical* = blocks a core journey or loses money/data. *High* = major function broken, no workaround. *Medium* = broken with a workaround. *Low* = cosmetic.

## 8. Enhancement Request Log Template

| ID | Requested by | Description | Business value | Decision (v1 / v1.1 / rejected) |
|---|---|---|---|---|
| E-001 | | | | |

*Expect Compare Centres and CMS to land here.*

---

## 9. UAT Sign-off Template

> **Application:** StudyNook · **Version:** _____ · **Environment:** Staging · **Dates:** _____
>
> Scripts executed: ____ / ____ · Passed: ____ · Failed: ____
> Critical open: ____ · High open: ____ · Medium/Low accepted: ____
>
> | Role | Name | Approved | Date | Signature |
> |---|---|---|---|---|
> | Product Owner | | ⬜ | | |
> | Business Stakeholder | | ⬜ | | |
> | QA Lead | | ⬜ | | |
> | Centre Owner representative | | ⬜ | | |
> | Student representative | | ⬜ | | |
>
> **Decision:** ⬜ GO to Staging ⬜ GO with conditions ⬜ NO-GO

---

## 10. Go/No-Go Recommendation

**From the engineering side, the recommendation is: proceed to UAT, conditional on §1 and §2.**

Supporting evidence from prior milestones — all verified, none assumed:
- Production build compiles, 0 type errors (M16)
- Architecture audited, no Critical/High issues (M17)
- All four role journeys pass end-to-end at data/wiring layer; 22/22 navigation links resolve (M18)
- Database validated: 20/20 migrations clean on a fresh DB, no orphans, backup/restore verified (M19)
- Security: OWASP Top 10 pass, IDOR/RBAC/SSRF blocked under live pentest (M20)
- Performance: sub-millisecond queries, 102 kB shared bundle, zero overbooking under concurrency (M21)
- SEO: no Critical/High issues (M22)
- Accessibility: no Critical/High issues; contrast computed and fixed (M23)

**The genuine risk is not code quality — it is that UAT starts before the environment is ready.** The two things most likely to derail it: the four non-existent features in §1 being tested as if they exist, and payment/email testing beginning before Razorpay test keys and Resend are configured.

**I cannot issue the Go/No-Go for release** — that is the Product Owner's decision, informed by UAT results that don't exist yet. This section is engineering input to that decision, not the decision.
