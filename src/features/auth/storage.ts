import type { AuthSession } from "./types";

// Brand-panel keys: deliberately different from the shopper app's, so the two sessions never mix.
const TOKEN_KEY = "tfb_token";
const USER_KEY = "tfb_user";
const REFRESH_KEY = "tfb_refresh";

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Reads the JWT `exp` claim without verifying the signature (the server does that). */
function isExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// ─── External store consumed via useSyncExternalStore ────────────────────────

const listeners = new Set<() => void>();
let cache: { raw: string | null; session: AuthSession | null } = { raw: null, session: null };

function notify() {
  listeners.forEach((listener) => listener());
}

/** Returns a referentially stable session object until the stored values change. */
export function getSessionSnapshot(): AuthSession | null {
  const store = safeStorage();
  const token = store?.getItem(TOKEN_KEY) ?? null;
  const rawUser = store?.getItem(USER_KEY) ?? null;
  const refreshToken = store?.getItem(REFRESH_KEY) ?? undefined;
  const raw = token && rawUser ? `${token}\n${rawUser}\n${refreshToken ?? ""}` : null;
  if (raw === cache.raw) return cache.session;

  let session: AuthSession | null = null;
  // An expired access token is fine while a refresh token exists: the API client swaps it on the next 401.
  if (token && rawUser && (refreshToken || !isExpired(token))) {
    try {
      session = { token, user: JSON.parse(rawUser), refreshToken };
    } catch {
      session = null;
    }
  }
  cache = { raw, session };
  return session;
}

/** `undefined` on the server means "not known yet" (rendered as loading). */
export function getServerSessionSnapshot(): AuthSession | null | undefined {
  return undefined;
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  // Other tabs changing the session fire `storage`; keep every tab in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === TOKEN_KEY || event.key === USER_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function writeSession(session: AuthSession) {
  const store = safeStorage();
  store?.setItem(TOKEN_KEY, session.token);
  store?.setItem(USER_KEY, JSON.stringify(session.user));
  if (session.refreshToken) store?.setItem(REFRESH_KEY, session.refreshToken);
  else store?.removeItem(REFRESH_KEY);
  notify();
}

export function clearSession() {
  const store = safeStorage();
  store?.removeItem(TOKEN_KEY);
  store?.removeItem(USER_KEY);
  store?.removeItem(REFRESH_KEY);
  notify();
}

export function getRefreshToken() {
  return safeStorage()?.getItem(REFRESH_KEY) ?? null;
}

/** True when storage holds credentials that aren't usable (expired or corrupt). */
export function hasStaleCredentials() {
  const store = safeStorage();
  return Boolean(store?.getItem(TOKEN_KEY)) && getSessionSnapshot() === null;
}
