/** Reject cross-site browser writes; authenticated non-browser clients may omit Origin. */
export function isAllowedWriteOrigin(method: string, origin: string | null, fetchSite: string | null, expectedOrigin: string): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) return true;
  if (fetchSite === "cross-site") return false;
  if (origin === null) return true;
  try { return new URL(origin).origin === new URL(expectedOrigin).origin; }
  catch { return false; }
}
