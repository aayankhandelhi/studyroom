import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact StudyNook',
  description: 'Get in touch with the StudyNook team — support for students, and listing enquiries for study space owners.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold">Contact us</h1>
      <div className="mt-6 space-y-6 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Students</h2>
          <p className="mt-1">
            Questions about a booking, payment or refund? Email{' '}
            {/* TODO(client): replace with your real support address */}
            <a className="underline" href="mailto:support@studynook.app">support@studynook.app</a>.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Study space owners</h2>
          <p className="mt-1">
            Want to list your space? Create an owner account, or email{' '}
            <a className="underline" href="mailto:owners@studynook.app">owners@studynook.app</a>.
          </p>
        </section>
        {/* TODO(client): add registered business address, phone and hours before launch —
            these also strengthen Local SEO and are expected by payment providers. */}
      </div>
    </main>
  );
}
