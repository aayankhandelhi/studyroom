# docs/DECISIONS.md — architecture decision record

Append-only. Newest first.

## ADR-014 — Real email via Resend with queue-only fallback
`lib/email.ts` sends transactional email through Resend (REST) and records every
attempt in `email_logs` (sent/failed/queued). When RESEND_API_KEY is absent it
logs 'queued' and returns false — the product still works, nothing is lost.
Enquiries now send a sender confirmation + an owner notification (owner email
looked up via the service-role admin API, since it lives in auth.users). Emails
are fire-and-forget so a mail hiccup never fails the DB write.

## ADR-013 — Razorpay payments with graceful fallback (0009)
Payment capture added: server creates the order (amount from DB, never client),
checkout runs client-side, signature is verified server-side, and a
signature-verified idempotent webhook is the authoritative confirmation. When
keys are absent the flow degrades to pay-at-centre so the product works pre-KYC.
Migration 0009.

## ADR-012 — Bookings table + server-priced booking flow (0008)
The detail page's "Book a seat" linked to a route that didn't exist. Added a
`bookings` table (RLS: student own, owner reads own centres, admin all) and a
booking flow where the AMOUNT is read server-side from the resource pricing json
(client never sends price). Payment capture stays out of scope (Razorpay feature).
Migration 0008.

## ADR-011 — Onboarding role selection via `choose_role` (not direct update)
profiles RLS forbids self-changing `role` (anti-escalation to admin). Onboarding
still needs student-vs-owner selection, so a SECURITY DEFINER `choose_role(role)`
allows exactly student|owner (never admin), refuses to alter an existing admin,
and marks onboarding complete. Auth callback routes un-onboarded users to
/onboarding. Migration 0007.

## ADR-010 — Claim approval is atomic (approve_claim function)
Approving a claim marks the claim approved AND transfers `centres.owner_id` to the
claimant AND rejects other pending claims on that centre — three writes that must
not partially apply. Implemented as a SECURITY DEFINER `approve_claim(claim_id)`
function (admin-gated internally, audited). Migration 0006. Charter: transactions
for multi-table saves.

## ADR-009 — `ActionError` for expected failures in Server Actions
Added a throwable `ActionError(code, message)` that the `action()` wrapper maps to
the matching `Result` (CONFLICT, FORBIDDEN, NOT_FOUND …). Lets action bodies raise
friendly, typed failures (e.g. "already reviewed", "owners can't review") without
each returning ad-hoc shapes. DB guards (unique constraint 23505, self-review
trigger) are translated to these at the boundary.

## ADR-008 — Form-to-database verification mandate (updated charter)
The latest master prompt requires every data-backed form to be provably wired to
Supabase and inspectable in Table Editor / SQL Editor. Adopted: (1) a field→column
mapping doc, (2) a schema/ERD/verification-SQL doc, (3) an approval gate before any
schema change. Consequence: forms are "built" (code correct) vs "complete"
(verified live) — the latter needs a live Supabase run. Migrations 0003/0004 are
now marked PROPOSED pending approval.

## ADR-007 — Admin authorization: middleware + layout + action (triple gate)
Admin access is checked in middleware (fast redirect), again in the admin layout
(server-side, authoritative), and again in every admin Server Action
(`requireRole('admin')`) which also writes an audit entry. Hidden nav is never
treated as security. Moderation mutates `centres.status`; the 0003 trigger keeps
`is_published` in sync, so approving a listing publishes it atomically.

## ADR-006 — Directory data layer as one migration (0003)
Added the full directory/moderation backbone (status lifecycle, categories,
locations, images, enquiries, reviews + reports, claims, saved, featured,
notifications, audit logs, onboarding, email logs) in a single migration with
RLS + indexes + triggers. Rationale: these tables are interdependent and share
RLS patterns; shipping them together keeps the schema coherent.

## ADR-005 — `status` authoritative, `is_published` synced by trigger
Charter requires a full listing lifecycle. Rather than replace `is_published`
(which 0002 RLS/indexes depend on), `centres.status` is authoritative and a
trigger keeps `is_published = (status = 'approved')`. Avoids rewriting 0002.

## ADR-004 — Keyset pagination for feeds
Discovery uses (rating desc, id desc) keyset cursors, not OFFSET, so paging is
O(1) at any depth over millions of rows. Index: `idx_centres_feed`.

## ADR-003 — Server Actions return `Result<T>`
Actions never throw across the RSC boundary; they return a typed discriminated
union so the UI renders error states and TS forces both branches to be handled.

## ADR-002 — RBAC = `role` enum + defense in depth
Single `profiles.role` enum (student/owner/admin), enforced in **both** RLS
(`auth_role()`) and server (`requireRole()`). admin satisfies any role.

## ADR-001 — Foundation-first rebuild in `studynook-prod`
Rebuilt from a clean production foundation rather than retrofitting the earlier
prototype, to apply strict TS, Zod, RBAC, TanStack, and shadcn consistently.

## Open decisions
- **Design system:** charter mandates Inter-only light theme; StudyNook brand
  (green/gold, Jakarta) conflicts. DEFERRED by owner — revisit before UI hardening.
- **Rate-limit store:** in-memory now; move to Upstash Redis for Vercel multi-instance.
