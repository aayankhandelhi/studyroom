import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'The terms that apply when you use StudyNook to find and book study spaces.',
  alternates: { canonical: '/terms' },
};

/**
 * NOTE FOR THE CLIENT / LEGAL REVIEW
 * ----------------------------------
 * Structure and platform-accurate operational terms are provided below.
 * All bracketed [ ... ] items are business decisions that must be filled in, and the
 * document must be reviewed by a qualified lawyer before launch.
 */
export default function TermsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: [DATE — set at launch]</p>

      <div className="mt-6 space-y-6 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">1. About these terms</h2>
          <p className="mt-1">
            These terms govern your use of StudyNook, operated by [LEGAL ENTITY NAME]. By creating an
            account or making a booking you agree to them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">2. What StudyNook is</h2>
          <p className="mt-1">
            StudyNook is a marketplace connecting students with independently operated study spaces. The
            booking contract for the space itself is between you and the space owner. We are responsible
            for the platform and payment handling, not for the condition or operation of a venue.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">3. Accounts</h2>
          <p className="mt-1">
            You must provide accurate details and keep your login secure. You are responsible for activity
            on your account. Accounts may be suspended for abuse, fraud, or breach of these terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">4. Bookings and payment</h2>
          <p className="mt-1">
            Prices are shown before you pay and are calculated by StudyNook at the time of booking. A
            booking is confirmed only once payment is successfully processed. You will receive a booking
            confirmation and an invoice number.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">5. Cancellations and refunds</h2>
          <p className="mt-1">
            [CANCELLATION WINDOW AND REFUND POLICY — e.g. full refund if cancelled more than X hours
            before the start time; no refund thereafter. This must match what the platform enforces and
            what you agree with owners.] Approved refunds are returned via the original payment method.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">6. Reviews and content</h2>
          <p className="mt-1">
            Reviews must be honest and based on genuine experience. We may remove content that is
            abusive, misleading, or unlawful. You retain ownership of what you post but grant us a licence
            to display it on the platform.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">7. Owner obligations</h2>
          <p className="mt-1">
            Owners must hold the right to list their space, keep availability and pricing accurate, honour
            confirmed bookings, and comply with applicable safety and licensing requirements.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">8. Liability</h2>
          <p className="mt-1">
            [LIABILITY AND LIMITATION CLAUSES — must be drafted for your jurisdiction.]
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">9. Governing law</h2>
          <p className="mt-1">
            These terms are governed by the laws of [JURISDICTION], and disputes are subject to the courts
            of [JURISDICTION].
          </p>
        </section>
      </div>
    </main>
  );
}
