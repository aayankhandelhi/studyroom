# HANDOFF.md — developer checklist

A short, ordered path from this zip to a live site. Full detail in
`docs/DEPLOYMENT.md`; project context in `README.md` and `SCOPE.md`.

## 0. Decide the database
Use **Supabase / PostgreSQL** (Option A) — the app is wired to it. The MySQL
folder is a schema-only reference; ignore it for launch unless you're
deliberately re-platforming.

## 1. Accounts to create (need real credentials — can't be pre-done)
- [ ] Supabase project
- [ ] Vercel account + this repo on GitHub
- [ ] Google OAuth client (for social login)
- [ ] (optional) Razorpay account + KYC (online payments)
- [ ] (optional) Resend account + verified sending domain (email)

## 2. Local bring-up
- [ ] `npm install`
- [ ] `cp .env.example .env.local` and fill every key
- [ ] `npm run db:push` (applies migrations 0001–0009)
- [ ] `npm run db:types` (regenerates `types/database.types.ts` from the live DB)
- [ ] `psql "$DATABASE_URL" -f supabase/seed.sql` (6 sample centres with images)
- [ ] `npm run build` — must pass clean. Expect 1–2 minor first-run fixes
      (a generated-type correction, possibly an RLS/PostgREST-embed tweak).
- [ ] `npm run dev` → open http://localhost:3000, confirm centres render with images

## 3. Configure auth + admin
- [ ] Supabase → Auth → enable Google; redirect `<site>/auth/callback`
- [ ] Confirm email templates (verification, recovery)
- [ ] Promote yourself to admin:
      `update profiles set role='admin' where id='YOUR-AUTH-UID';`

## 4. Deploy
- [ ] Push to GitHub → import to Vercel
- [ ] Add all `.env.example` vars in Vercel (Production + Preview)
- [ ] Set production domain; update `NEXT_PUBLIC_SITE_URL` + OAuth redirects
- [ ] Deploy; enable Vercel Analytics
- [ ] (if payments) add Razorpay webhook → `<site>/api/webhooks/razorpay`

## 5. Verify live
- [ ] Sign up → verify → onboard → role works
- [ ] Browse centres (sample data shows), open a detail page, submit an enquiry
- [ ] Admin can approve a listing; approved listing goes public
- [ ] Each form's row appears in Supabase (SQL in `docs/DATABASE_SCHEMA.md`)

## Definition of done
All boxes above checked and the site reachable on the production domain with the
sample centres visible. Code/schema/docs in this zip are complete; the above are
the deploy-time steps that require your accounts and environment.
