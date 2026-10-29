"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Do not accept keystrokes until controlled fields have their client event handlers. */
export function ReadyFieldset({ children, className, label }: { children: ReactNode; className: string; label: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return <fieldset disabled={!ready} aria-busy={!ready} aria-label={label} className={`min-w-0 ${className}`}>
    {children}
  </fieldset>;
}
