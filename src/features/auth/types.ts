export type UserRole = "USER" | "ADMIN";

/** User object returned by /user/auth/login and /user/auth/signup. */
export type AuthUser = {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  /** Long-lived token used to get a new access token (brand sessions). */
  refreshToken?: string;
};

/** Signup returns a session, or (when email verification is on) only a flag: the emailed link must be used first. */
export type SignupResult = AuthSession | { requiresVerification: true; user: AuthUser };

export type LoginPayload = { email: string; password: string };
/** Brand registration: the details a brand gives when it signs up. */
export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  category?: string;
  websiteUrl?: string;
  physicalStoreAddress?: string;
};
export type ForgotPasswordPayload = { email: string };
export type ResetPasswordPayload = { token: string; newPassword: string };
export type VerifyEmailPayload = { token: string };
