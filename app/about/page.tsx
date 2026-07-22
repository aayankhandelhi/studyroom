import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About StudyNook',
  description:
    'StudyNook helps students in Warangal find, compare and book verified study spaces — study halls, reading rooms, libraries and coworking desks.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold">About StudyNook</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          StudyNook is a directory and booking platform for study spaces in Warangal, Telangana. We help
          students find a place to focus — study halls, reading rooms, libraries and coworking desks —
          with live availability, verified reviews and transparent pricing.
        </p>
        <p>
          Every listing is reviewed before it goes live. Owners manage their own availability and pricing,
          and students book and pay in a few taps, with instant confirmation.
        </p>
        <h2 className="pt-4 font-display text-xl font-bold text-foreground">What we offer</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Search and filter by area, space type, price and amenities</li>
          <li>Live seat availability and instant booking</li>
          <li>Verified student reviews and ratings</li>
          <li>Women-safe verified listings</li>
        </ul>
      </div>
    </main>
  );
}
