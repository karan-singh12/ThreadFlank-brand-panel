import { useEffect, useSyncExternalStore } from "react";
import { apiRequest } from "@/lib/api/client";
import { getSessionSnapshot } from "@/features/auth/storage";
import { useAuth } from "@/features/auth/AuthProvider";

// Credits: every generated image costs 1; packs are bought with Razorpay.

export type CreditPack = { id: string; name: string; description: string | null; price: number; credits: number; featured: boolean };
export type Catalogue = { paymentsEnabled: boolean; currency: string; freeCredits: number; videoCost: number; packs: CreditPack[] };
export type Wallet = { balance: number; freeCredits: number; imageCost: number; videoCost: number; paymentsEnabled: boolean };
export type CreditTransaction = { id: string; delta: number; balanceAfter: number; reason: string; note: string | null; createdAt: string };
export type CheckoutOrder = { orderId: string; amount: number; currency: string; keyId: string; pack: CreditPack };

/** A render was refused because the balance is too low (HTTP 402). */
export class OutOfCreditsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutOfCreditsError";
  }
}

export const billingApi = {
  async catalogue() {
    return (await apiRequest<Catalogue>("/billing/packs")).data;
  },
  async wallet(token: string) {
    return (await apiRequest<Wallet>("/billing/me", { token })).data;
  },
  async history(token: string) {
    return (await apiRequest<CreditTransaction[]>("/billing/history", { token })).data;
  },
  async createOrder(token: string, packId: string) {
    return (await apiRequest<CheckoutOrder>("/billing/orders", { method: "POST", token, body: { packId } })).data;
  },
  async verify(token: string, body: { orderId: string; paymentId: string; signature: string }) {
    return (await apiRequest<{ balance: number; credits: number }>("/billing/verify", { method: "POST", token, body })).data;
  },
};

// ─── Shared balance ──────────────────────────────────────────────────────────
// One balance for the whole app, so the Drape button, the profile menu and the pricing
// page agree, and a render's response can update it without another request.

let wallet: Wallet | null = null;
/** The session token the cached wallet belongs to, so switching accounts never shows the old balance. */
let walletFor: string | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setCreditBalance(balance: number | undefined | null) {
  if (typeof balance !== "number" || !wallet) return;
  wallet = { ...wallet, balance };
  emit();
}

export function refreshWallet() {
  const token = getSessionSnapshot()?.token;
  if (!token) return Promise.resolve();
  loading ??= billingApi
    .wallet(token)
    .then((w) => {
      wallet = w;
      walletFor = token;
      emit();
    })
    .catch(() => undefined)
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** The signed-in user's credits; `null` until loaded (or when signed out). */
export function useWallet(): Wallet | null {
  const { token } = useAuth();
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => wallet,
    () => null
  );
  useEffect(() => {
    if (token && walletFor !== token) refreshWallet();
  }, [token]);
  return token && walletFor === token ? value : null;
}
