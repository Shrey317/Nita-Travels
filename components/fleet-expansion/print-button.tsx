'use client';
export function PrintButton() {
  return <button className="rounded-lg bg-primary px-4 py-3 text-white print:hidden" onClick={() => window.print()}>Print / save PDF</button>;
}
