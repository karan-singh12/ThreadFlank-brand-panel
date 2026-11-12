import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import type {
  AuthSession,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SignupPayload,
  SignupResult,
  VerifyEmailPayload,
} from "./types";

/** What /brand/auth/login and /register return. */
type BrandAuthResponse = {
  accessToken: string;
  refreshToken: string;
  account: { id: string; email: string; name: string; role: string };
  brand: { name: string; logo: string };
};

/** The shared auth screens and guards speak AuthSession; a brand account is mapped onto it. */
function toSession(res: BrandAuthResponse): AuthSession {
  const user: AuthUser = {
    id: res.account.id,
    email: res.account.email,
    username: res.brand.name || res.account.name,
    role: "USER",
    bio: null,
    phone: null,
    location: null,
    avatar: res.brand.logo || null,
  };
  return { token: res.accessToken, refreshToken: res.refreshToken, user };
}

export const authApi = {
  async login(payload: LoginPayload) {
    const res = await apiRequest<BrandAuthResponse>(ENDPOINTS.brand.auth.login, { method: "POST", body: payload });
    return toSession(res.data);
  },

  /** Brands must verify their email before they can sign in, so this never returns a session. */
  async signup(payload: SignupPayload): Promise<SignupResult> {
    const body = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      category: payload.category || undefined,
      websiteUrl: payload.websiteUrl || undefined,
      physicalStoreAddress: payload.physicalStoreAddress || undefined,
    };
    await apiRequest<{ requiresVerification: true; email: string }>(ENDPOINTS.brand.auth.register, { method: "POST", body });
    const user: AuthUser = { id: "", email: payload.email, username: payload.name, role: "USER", bio: null, phone: null, location: null, avatar: null };
    return { requiresVerification: true, user };
  },

  /** Revokes the refresh token on the server; the local session is cleared either way. */
  async logout(refreshToken: string) {
    await apiRequest<null>(ENDPOINTS.brand.auth.logout, { method: "POST", body: { refreshToken } });
  },

  /** Resolves with the server's message; the backend never reveals whether the email exists. */
  async forgotPassword(payload: ForgotPasswordPayload) {
    const res = await apiRequest<null>(ENDPOINTS.brand.auth.forgotPassword, { method: "POST", body: payload });
    return res.message;
  },

  async resetPassword(payload: ResetPasswordPayload) {
    const res = await apiRequest<null>(ENDPOINTS.brand.auth.resetPassword, { method: "POST", body: payload });
    return res.message;
  },

  async verifyEmail(payload: VerifyEmailPayload) {
    const res = await apiRequest<null>(ENDPOINTS.brand.auth.verifyEmail, { method: "POST", body: payload });
    return res.message;
  },

  /** Resolves with the server's message; the backend never reveals whether the email exists. */
  async resendVerification(payload: ForgotPasswordPayload) {
    const res = await apiRequest<null>(ENDPOINTS.brand.auth.resendVerification, { method: "POST", body: payload });
    return res.message;
  },

  /** Cheap authenticated call used to confirm a stored token is still accepted. */
  async verifySession(token: string, signal?: AbortSignal) {
    await apiRequest<unknown>(ENDPOINTS.brand.auth.me, { token, signal });
  },
};
