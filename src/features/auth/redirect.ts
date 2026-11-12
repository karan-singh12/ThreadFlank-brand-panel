export const AFTER_AUTH_PATH = "/dashboard";

/**
 * Only allows same-origin relative paths from a `?next=` query param, so the
 * login page can't be used as an open redirect to another site.
 */
export function safeRedirect(next: string | null | undefined, fallback = AFTER_AUTH_PATH) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
