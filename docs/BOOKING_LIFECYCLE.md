# Booking lifecycle

How a booking moves through its states, and which mechanism enforces each rule.
Concurrency-critical logic lives in **PostgreSQL SECURITY DEFINER functions**
(the only place safe under concurrent load); server actions call them and map
errors to typed `Result` failures.

## States (`booking_status` enum)
```
pending ─► confirmed ─► checked_in ─► completed
   │           │
   │           ├─► cancelled ─► (refunded / partially_refunded via payment_status)
   │           └─► no_show
   └─► expired            (pending hold elapsed)
```
- **pending** — created, awaiting payment. Has `expires_at` (hold window from `booking_rules.hold_minutes`).
- **confirmed** — payment webhook verified (existing payment flow).
- **checked_in** — student checked in on-site.
- **completed** — booking period ended in good standing.
- **cancelled** — by student (before cutoff), owner, or admin. Frees capacity + promotes waitlist.
- **no_show** — grace period passed without check-in.
- **expired** — pending hold elapsed (via `expire_pending_bookings()` cron).
- **refunded / partially_refunded** — see payment_status; set by the refund flow.

## Key functions (migration 0011)
| Function | Guarantees |
|---|---|
| `book_seat` (0010) | Locks resource row, counts overlapping active bookings, rejects if full, inserts — **no double-booking**. |
| `cancel_booking(id, reason)` | Authorizes (admin \| centre owner \| booker before cutoff), sets cancelled, audits, notifies, then `promote_waitlist`. |
| `promote_waitlist(resource_id)` | If a seat is free, promotes the oldest `waiting` entry (`FOR UPDATE SKIP LOCKED`), notifies. |
| `expire_pending_bookings()` | Bulk-expires stale pending holds. Run on a schedule (Supabase cron / edge function). |

## Cancellation rules
- Student: allowed only until `now <= starts_at − cancel_cutoff_hours`.
- Owner/Admin: always. Every cancellation is audited (`booking.cancelled`) and notifies the booker.
- Capacity is released implicitly (status leaves the active set `{pending,confirmed,checked_in}`), and the waitlist is promoted in the same transaction.

## Refunds (`refunds` table + `refundBooking` action)
- Manual (owner/admin) and provider-integrated (Razorpay `createRefund`).
- **Partial** supported (`amount < paid` → `partially_refunded`, else `refunded`).
- **Duplicate-safe**: refuses if a `pending|processing|succeeded` refund already exists; unique `(booking_id, razorpay_refund_id)`.
- Audited (`booking.refunded`).

## Reschedule (`rescheduleBooking`)
Acquire the new slot via `book_seat` **first**; only on success `cancel_booking` the old one and tag `rescheduled_from`. A failed move never loses the original seat. Race-safe because both steps are the atomic `book_seat`/`cancel_booking` functions.

## Waitlist (`waitlist_entries`)
- Join when full (`joinWaitlist`); unique per `(resource, user, status)`.
- Auto-promoted by `promote_waitlist` when a seat frees (on cancel/expire).
- Promoted users get an in-app notification; `expires_at` bounds the offer.

## Booking rules (`booking_rules`, per centre)
Opening/closing time, blocked dates, max advance days, min/max duration, cancel cutoff, grace period, hold minutes. Owner/admin writable; publicly readable.

## Notifications
Rows in `notifications` for created/confirmed/cancelled/rescheduled/completed/refunded/waitlist-promoted; email via the existing `lib/email.ts` (queues when Resend unset).

## Runtime verification required
The concurrency guarantees (no double-book, waitlist promotion, hold expiry) are correct by construction (row locks + atomic functions) but must be **load-tested against a live Supabase** to be certified — see `tests/`.
