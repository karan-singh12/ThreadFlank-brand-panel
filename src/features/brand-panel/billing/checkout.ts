import { brandApi } from "../api";
import type { CurrentPlan } from "../types";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void };
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<RazorpayCtor> | null = null;

/** Loads Razorpay Checkout once, on the first purchase. */
function loadRazorpay(): Promise<RazorpayCtor> {
  const existing = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
  if (existing) return Promise.resolve(existing);
  scriptPromise ??= new Promise<RazorpayCtor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve((window as unknown as { Razorpay: RazorpayCtor }).Razorpay);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Couldn’t load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export type PurchaseResult = { status: "paid"; balance: number; credits: number; plan?: CurrentPlan } | { status: "dismissed" };

/**
 * Buys a credit pack. The server creates the Razorpay order (applying the promo code), Checkout takes
 * the payment, and the server verifies the signature before adding credits. The webhook credits the
 * order too, so closing the tab right after paying still ends with the credits added.
 */
export async function buyPack(token: string, pack: { id: string; name: string }, code: string | undefined, prefill: { email?: string; name?: string }): Promise<PurchaseResult> {
  const [Razorpay, order] = await Promise.all([loadRazorpay(), brandApi.billingOrder(token, pack.id, code)]);

  return new Promise<PurchaseResult>((resolve, reject) => {
    const checkout = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Threadflank",
      description: `${order.credits} AI credits · ${pack.name}`,
      prefill,
      theme: { color: "#6645eb" },
      handler: (res: RazorpayResponse) => {
        brandApi
          .billingVerify(token, { orderId: res.razorpay_order_id, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature })
          .then((r) => resolve({ status: "paid", balance: r.balance, credits: r.credits, plan: r.plan }))
          .catch(reject);
      },
      modal: { ondismiss: () => resolve({ status: "dismissed" }) },
    });
    checkout.open();
  });
}
