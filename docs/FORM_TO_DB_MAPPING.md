# docs/FORM_TO_DB_MAPPING.md — Form → Database mapping & verification

> Satisfies the **Form-to-database storage & backend verification** mandate.
> For every form: route, allowed role, fields, storage classification, exact
> table/column/type/FK/RLS, and operation. Verification SQL lives in
> `docs/DATABASE_SCHEMA.md`.
>
> **Status key:** ✅ built & wired · 🟡 schema ready, UI pending · 🔎 read-only (no storage)
>
> **Approval gate:** migrations `0003_directory` and `0004_occupancy` are now APPROVED (were
> PROPOSED); reviewed & approved, ready to apply. Nothing below is "complete" until submitted in
> the browser and verified in Supabase Table Editor / SQL Editor.

---

## A. Form inventory

| # | Form | Route | Role | Storage | Operation | Status |
|---|------|-------|------|---------|-----------|--------|
| 1 | Create listing | `/owner/centres/new` | owner | Permanent | Create | ✅ |
| 2 | Moderate listing (approve/reject/suspend) | `/admin/centres` | admin | Permanent | Update | ✅ |
| 3 | Moderate review (remove/keep) | `/admin/reviews` | admin | Permanent | Update | ✅ |
| 4 | Resolve review report | `/admin/reviews` | admin | Permanent | Update | ✅ |
| 5 | Enquiry / contact centre | `/centres/[slug]` | student / guest | Permanent (+ email) | Create + Email | ✅ |
| 6 | Write review | `/centres/[slug]` | student | Permanent | Create | ✅ |
| 7 | Report a review | `/centres/[slug]` | student / guest | Permanent | Create | ✅ |
| 8 | Claim a listing | `/centres/[slug]` | owner/student | Permanent | Create | ✅ |
| 9 | Save / unsave listing | detail + `/saved` | student | Permanent | Create / Delete | ✅ |
| 10 | Check in / out | `/centres/[slug]` | student | Permanent | Create / Update | ✅ |
| 11 | Listing image upload | `/owner/centres/[id]` | owner | Upload (Storage) + Permanent row | Upload + Create | ✅ |
| 12 | Discovery search & filters | `/centres` | any | **None** (search/filter-only) | Read | 🔎 |
| 14 | Book a seat | `/centres/[slug]/book` | student | Permanent | Create | ✅ |
| 15 | Pay for booking | `/centres/[slug]/book/confirmed` | student | Permanent (+ webhook) | Update | ✅ |
| 13 | Auth (sign-up / sign-in / reset / onboarding) | `/login` `/onboarding` | any | Permanent (auth.users → profiles) | Create/Read | ✅ |

---

## B. Field → table/column mapping (per form)

### 1. Create listing ✅ (`createCentre`, `features/centres/actions.ts`)
Role: **owner** (`requireRole('owner')` + RLS insert policy). Table: **`centres`**.

| Field label | field name | type | req | validation (Zod) | → column | PG type | notes |
|---|---|---|---|---|---|---|---|
| Centre name | `name` | text | ✔ | 2–120 chars | `name` | `text` | |
| Area | `area` | text | ✔ | 2–80 chars | `area` | `text` | |
| Space type | `spaceType` | enum | ✔ | study_hall/reading_room/coworking/both | `space_type` | `space_type` enum | |
| Latitude | `lat` | number | ✔ | −90..90 | `lat` | `double precision` | |
| Longitude | `lng` | number | ✔ | −180..180 | `lng` | `double precision` | |
| Emoji | `emoji` | text | ✖ | ≤4 chars, default 📖 | `emoji` | `text` | |
| — (derived) | — | — | — | slugify(name), uniqueness-checked | `slug` | `text unique` | server-generated |
| — (session) | — | — | — | `auth.uid()` | `owner_id` | `uuid FK→profiles` | never from client |
| — (default) | — | — | — | forced `'draft'` | `status` | `listing_status` | goes to `pending_review` on submit-for-review |

Operation: **INSERT** one row. Duplicate-guard: unique `slug` (retry-suffixed). RLS: `centres owner insert` (`owner_id = auth.uid() and auth_role() in ('owner','admin')`).

### 2. Moderate listing ✅ (`moderateCentre`)
Role: **admin**. Table: **`centres`** (UPDATE). Also writes **`audit_logs`**.

| Field | field name | type | req | → column | notes |
|---|---|---|---|---|---|
| Decision | `decision` | enum | ✔ | `status` | approve→approved, reject→rejected, suspend→suspended, restore→approved, archive→archived |
| Reason | `reason` | text | ✖ (✔ for reject, UI-enforced) | `rejection_reason` / `admin_notes` | shown to owner on reject |
| — (session) | — | — | — | `reviewed_by = auth.uid()`, `reviewed_at = now()` | |

Side effect: trigger `sync_centre_published` sets `is_published = (status='approved')`. Audit: `log_audit('centre.<decision>', 'centre', id)`. RLS: `centres owner update` (owner or admin).

### 3. Moderate review ✅ (`moderateReview`)
Role: **admin**. Table: **`reviews`** (UPDATE `status` → published/removed). Audit: `review.<decision>`. RLS: `reviews admin moderate`.

### 4. Resolve report ✅ (`resolveReport`)
Role: **admin**. Table: **`review_reports`** (UPDATE `resolved = true`). Audit: `report.resolve`. RLS: `reports admin update`.

### 5. Enquiry / contact ✅ (`submitEnquiry`, `features/enquiries/actions.ts`)
Role: **student or guest**. Table: **`enquiries`** (INSERT). Also **`email_logs`** + owner notification.

| Field | field name | type | req | validation | → column | PG type |
|---|---|---|---|---|---|---|
| Your name | `name` | text | ✔ | 2–80 | `name` | `text` |
| Email | `email` | email | ✔ | email format | `email` | `text` |
| Phone | `phone` | tel | ✖ | E.164-ish | `phone` | `text` |
| Message | `message` | textarea | ✔ | 10–1000 | `message` | `text` |
| — (context) | — | — | — | from route | `centre_id` | `uuid FK→centres` |
| — (session) | — | — | — | `auth.uid()` or null (guest) | `sender_id` | `uuid FK→profiles` |
| — (default) | — | — | — | `'new'` | `status` | `enquiry_status` |

Operation: **INSERT** + trigger email to owner + confirmation to sender (logged in `email_logs`). Duplicate-guard: index `idx_enquiries_dedupe (centre_id, email, md5(message))` + app-level rate limit. RLS: `enquiries insert` (`sender_id = auth.uid() or sender_id is null`).

### 6. Write review ✅ (`submitReview`)
Role: **student**. Table: **`reviews`** (INSERT). Unique `(centre_id, author_id)`; trigger `block_self_review` prevents owners reviewing own centre.

| Field | field name | type | req | → column | PG type |
|---|---|---|---|---|---|
| Rating | `rating` | int | ✔ | `rating` | `int` (1–5 check) |
| Review | `body` | textarea | ✖ | `body` | `text` |
| — context | — | — | — | `centre_id` | `uuid FK` |
| — session | — | — | — | `author_id = auth.uid()` | `uuid FK` |

RLS: `reviews author insert` (`author_id = auth.uid()`).

### 7. Report a review ✅ (`reportReview`)
Role: student/guest. Table: **`review_reports`** (INSERT `review_id`, `reason`, `reporter_id`). RLS: `reports insert`.

### 8. Claim a listing ✅
Role: owner/student. Table: **`listing_claims`** (INSERT). Unique `(centre_id, claimant_id)`.

| Field | field name | req | → column |
|---|---|---|---|
| Evidence | `evidence` | ✔ | `evidence` |
| — context | — | — | `centre_id` |
| — session | — | — | `claimant_id = auth.uid()` |
| — default | — | — | `status = 'pending'` |

RLS: `claims insert` (`claimant_id = auth.uid()`).

 unsave 🟡/ unsave 🟡
Role: student. Table: **`saved_listings`** (INSERT/DELETE, PK `(user_id, centre_id)` — idempotent, no dupes). RLS: `saved self`.

 out 🟡/ out 🟡
Role: student. Table: **`check_ins`** (INSERT on check-in; UPDATE `checked_out_at` on check-out). Powers occupancy view, streaks, verified reviews. RLS: `checkins self`.

### 11. Listing image upload ✅
Role: owner. Storage bucket **`listing-images`** (file) + **`listing_images`** row (`storage_path`, `is_cover`, `sort_order`). One cover per centre (unique partial index). RLS: `images write` (owner/admin).

### 12. Discovery search & filters 🔎
Role: any. **No storage** — read-only. Inputs `q, area, spaceType, womenSafe, maxMonthly` are Zod-validated query params → keyset SELECT on `centres`. Documented here to satisfy the mandate's "search/filter-only" classification.

### 13. Auth ✅ (password + Google OAuth + magic link + reset + onboarding)
Supabase Auth writes `auth.users`; trigger `handle_new_user` inserts **`profiles`** (`id, full_name, phone`, `role` default `student`). No service-role key in client. RLS: profiles self-read/update (no self-escalation of `role`).

---

## C. Cross-cutting guarantees (mandate → implementation)

- **Frontend + server validation:** one Zod schema per form, used by React Hook Form *and* re-parsed server-side in the `action()` wrapper. No action trusts client data.
- **Duplicate / double-click:** unique constraints (slug, one-review-per-user, saved PK, enquiry dedupe index) + `useTransition` disabled-while-pending on the client.
- **Multi-table saves:** wrapped in Postgres functions/transactions where >1 table is written (e.g. approve = update centre + audit; enquiry = insert + email log).
- **No service-role in client:** `lib/supabase/admin.ts` is `server-only`.
- **RLS everywhere:** every table above has row-level policies; server `requireRole()` is defense-in-depth, not the only gate.
- **Manipulated IDs:** all IDs are `uuid`; RLS scopes rows to owner/author/admin, so tampering a slug/ID cannot read or write another user's data.
