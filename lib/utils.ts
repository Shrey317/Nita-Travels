import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names, resolving conflicts (e.g. "p-2 p-4" -> "p-4").
 * Used by every UI primitive to allow callers to override default styles.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a Next.js searchParams value to a string array. A repeated query param
 * (?vehicleId=CR01&vehicleId=CR02) arrives as string[]; a single occurrence arrives as a plain
 * string; an absent one arrives as undefined. Every filtered list page needs this same
 * normalization for its multi-select params, so it lives here once instead of four times.
 */
export function toStringArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
