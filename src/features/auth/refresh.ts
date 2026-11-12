import { apiRequest, setTokenRefresher } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import { clearSession, getRefreshToken, getSessionSnapshot, writeSession } from "./storage";

let inFlight: Promise<string | null> | null = null;

/**
 * Swaps the stored refresh token for a new access/refresh pair. One request is shared by every
 * call that hit a 401 at the same moment, because a refresh token can only be used once.
 */
function refreshSession(): Promise<string | null> {
  inFlight ??= (async () => {
    const refreshToken = getRefreshToken();
    const session = getSessionSnapshot();
    if (!refreshToken || !session) return null;
    try {
      const res = await apiRequest<{ accessToken: string; refreshToken: string }>(ENDPOINTS.brand.auth.refresh, {
        method: "POST",
        body: { refreshToken },
      });
      writeSession({ ...session, token: res.data.accessToken, refreshToken: res.data.refreshToken });
      return res.data.accessToken;
    } catch {
      clearSession();
      return null;
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

setTokenRefresher(refreshSession);
