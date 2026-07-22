# StudyNook — End-to-End Functional QA Report (Milestone 18)

**Goal:** Validate every user journey across Guest, Student, Owner, and Admin roles.
**Method & scope boundary:** This QA validates the layers executable in this environment — the **data/logic layer** (live PostgreSQL), the **route/navigation/wiring layer** (pages, actions, links, redirects, guards, validation), and the **build** (compiles, verified M16). It does **not** include live browser click-through, cross-browser rendering, or screenshots, because there is no deployed instance to drive. Those require the app running on infrastructure (see §6).

---

## 1. Summary

All four role journeys pass end-to-end at the data + wiring layer. Navigation is intact (all internal links resolve). Form validation is enforced at every entry point. No Critical or High functional defects found. Every failure encountered during testing traced to **test-fixture errors** (malformed UUIDs, wrong enum value, missing profile rows), not application defects — each was corrected and the journey then passed.

**Verdict: business workflows APPROVED** at the verifiable layers; live browser QA pending deployment.

---

## 2. Role Journeys — End-to-End (live DB)

### Guest — PASS
- Browse published centres (11 visible) ✅
- View centre details + reviews without auth ✅

### Student — PASS
- Register as student ✅
- Book a seat → pay → **invoice auto-assigned** (`SN-2026-######` on the unpaid→paid transition) ✅
- Submit a review ✅
- Receive notification ✅

### Owner — PASS
- Register as owner ✅
- Create centre → enters `pending_review` (awaiting approval, not auto-published) ✅
- Owner dashboard aggregates bookings/customers across their centres ✅

### Admin — PASS
- Approve owner's centre → becomes published + visible to guests ✅
- Manage user roles (student→owner→student) via guarded function ✅
- Moderation + reports available (verified M11) ✅

---

## 3. Functional Review

| Area | Status | Evidence |
|---|---|---|
| Registration | ✅ | `signUp` action + role via onboarding; profile created |
| Authentication | ✅ | `signInWithPassword`, `sendMagicLink`, callback redirect chain |
| Forgot password | ✅ | `requestPasswordReset` + `/auth/reset` + `/auth/update-password` routes |
| Email verification | ✅ | Handled by Supabase Auth natively (verify/reset/magic-link) |
| Search | ✅ | keyword/filter/price/rating + geo (M5), all index-backed |
| Listings/details | ✅ | detail page renders gallery/amenities/pricing/reviews/similar/map (M6) |
| Booking | ✅ | atomic `book_seat`, concurrency-safe (M7) |
| Payments | ✅ | server-priced, HMAC webhook, idempotent, invoice (M8) |
| Reviews | ✅ | submit + moderation + reports |
| Notifications | ✅ | in-app + email, all lifecycle events wired (M12) |
| Dashboards | ✅ | student/owner/admin all built + verified (M9/M10/M11) |
| Logout | ✅ | `signOut` action |

---

## 4. Navigation Review

| Item | Status |
|---|---|
| Page links | ✅ all 22 internal link targets resolve to existing routes |
| Buttons/actions | ✅ wired to server actions returning `Result<T>` |
| Menus | ✅ owner/admin nav include all sections (calendar/customers/users added this session) |
| Breadcrumbs | ✅ component + JSON-LD BreadcrumbList |
| Redirects | ✅ login→onboarding→destination chain; role guards redirect unauthorized |
| Forms | ✅ every form backed by a Zod schema |
| Validation | ✅ 26 schemas, 12 action files validate via `safeParse`/`action()` |

---

## 5. Regression

Re-verified prior fixes still hold: waitlist over-promotion (0012), double-refund guard (0013), RLS recursion (0014), all migrations idempotent, build compiles (0 type errors). No regressions introduced by M9–M17 work.

---

## 6. What This QA Could NOT Cover (requires deployment)

Honest boundary — these need the app running on infrastructure with real services:
- Live browser click-through + **screenshots/evidence** (no deployed instance to capture)
- Cross-browser rendering (Chrome/Firefox/Safari/Edge)
- Mobile responsive behaviour on real devices
- The actual Razorpay payment redirect + real webhook delivery
- Real email delivery (Resend) and OAuth round-trip
- Google Maps/Places rendering (needs API key)

These are **environment-dependent, not code defects.** The code paths behind them are wired and unit/logic-verified.

---

## 7. Bug List & Fixed Defects

**Application defects found this session:** none in M18. (All prior-session defects — RLS recursion, XSS, silent cancellations, ssr/supabase-js mismatch — were fixed in their respective milestones.)

**Test-fixture issues encountered (not app bugs), corrected during QA:**
- Malformed UUIDs (letters `s`/`o`) → used valid hex
- Wrong enum value (`pending` vs `pending_review`) → corrected
- Missing profile rows for test users → created (profiles FK to auth.users)

---

## 8. Exit Criteria

| Criterion | Status |
|---|---|
| All user journeys completed successfully | ✅ (data/wiring layer) |
| No broken navigation | ✅ all links resolve |
| No Critical defects | ✅ none |
| No High severity functional defects | ✅ none |
| Regression tests passed | ✅ |
| Business workflows approved | ✅ at verifiable layers; live browser QA pending deployment |

## 9. Verdict

**APPROVED at the data, logic, wiring, and build layers.** All four role journeys complete successfully end-to-end, navigation is intact, validation is enforced, and no Critical/High functional defects exist. The remaining QA (live browser, cross-browser, mobile, screenshots, real payment/email/OAuth) is **deployment-gated** — it can only be performed once the app is running on infrastructure, and should be the first task post-deploy.
