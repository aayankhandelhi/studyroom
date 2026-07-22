import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How StudyNook collects, uses and protects your personal data.',
  alternates: { canonical: '/privacy' },
};

/**
 * NOTE FOR THE CLIENT / LEGAL REVIEW
 * ----------------------------------
 * This page provides the required STRUCTURE and the factual technical detail about
 * what the application actually does with data (which is accurate as built).
 * The bracketed [ ... ] items must be completed by the operating business, and the
 * whole document should be reviewed by a qualified lawyer before launch.
 * A payment provider (Razorpay) will typically require a published privacy policy.
 */
export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: [DATE — set at launch]</p>

      <div className="mt-6 space-y-6 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Who we are</h2>
          <p className="mt-1">
            StudyNook is operated by [LEGAL ENTITY NAME], [REGISTERED ADDRESS]. For any privacy question,
            contact [PRIVACY CONTACT EMAIL].
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">What we collect</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Account details you provide: name, email address, and optionally a phone number.</li>
            <li>Booking records: which space you booked, when, and the amount paid.</li>
            <li>Reviews and enquiries you submit.</li>
            <li>Approximate location, only when you choose to use &quot;search near me&quot;.</li>
            <li>Basic technical and usage data for security and analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Payments</h2>
          <p className="mt-1">
            Card and payment details are handled entirely by our payment provider, Razorpay. We never
            receive or store your full card details.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">How we use your data</h2>
          <p className="mt-1">
            To create and manage your account, process bookings and refunds, send booking notifications,
            display reviews, prevent fraud and abuse, and meet legal obligations.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Who we share it with</h2>
          <p className="mt-1">
            Study space owners see the booking details necessary to honour your booking. We also use
            service providers: Supabase (database and authentication), Razorpay (payments), Resend
            (transactional email) and Vercel (hosting and analytics). We do not sell your data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Retention</h2>
          <p className="mt-1">
            We keep booking and payment records for [RETENTION PERIOD — set per applicable tax/accounting
            law]. You can request deletion of your account at any time.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Your rights</h2>
          <p className="mt-1">
            You can request access to, correction of, or deletion of your personal data by contacting
            [PRIVACY CONTACT EMAIL]. [Add the specific statutory rights and complaint route that apply in
            your operating jurisdiction.]
          </p>
        </section>
      </div>
    </main>
  );
}
