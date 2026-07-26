"use client";

import { useEffect } from "react";

/**
 * Next.js's top-level error boundary — catches failures even in the root layout itself, which
 * app/(dashboard)/error.tsx can't reach. Requires its own <html>/<body> since it replaces the
 * root layout entirely when triggered. Styled inline rather than with Tailwind classes on
 * purpose: this is the fallback for when something in app startup itself has gone wrong, so it
 * shouldn't depend on the same CSS pipeline that may be implicated.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", fontFamily: "sans-serif", textAlign: "center", padding: "1rem" }}>
          <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>Something went wrong</p>
          <p style={{ fontSize: "0.875rem", color: "#64748B" }}>Please try refreshing the page.</p>
          <button
            onClick={reset}
            style={{ borderRadius: "0.5rem", backgroundColor: "#0D9488", color: "white", padding: "0.5rem 1rem", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
