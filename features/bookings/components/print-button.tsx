'use client';

/** Small client button that opens the browser print dialog (print-to-PDF). */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
    >
      Print / Save as PDF
    </button>
  );
}
