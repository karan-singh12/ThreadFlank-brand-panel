import { billingApi, setCreditBalance, type CreditPack } from "./api";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void };
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<RazorpayCtor> | null = null;

/** Loads Razorpay Checkout once, on first purchase. */
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

export type PurchaseResult = { status: "paid"; balance: number; credits: number } | { status: "dismissed" };

/**
 * Buys a credit pack: the server creates a Razorpay order, Checkout takes the payment, and the
 * server verifies the signature and adds the credits. (The webhook also credits the order, so a
 * closed tab after paying still gets its credits.)
 */
export async function buyPack(token: string, pack: CreditPack, prefill: { email?: string; name?: string }): Promise<PurchaseResult> {
  const [Razorpay, order] = await Promise.all([loadRazorpay(), billingApi.createOrder(token, pack.id)]);

  return new Promise<PurchaseResult>((resolve, reject) => {
    const checkout = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Threadflank",
      description: `${pack.credits} AI looks · ${pack.name}`,
      prefill,
      theme: { color: "#6645eb" },
      handler: (res: RazorpayResponse) => {
        billingApi
          .verify(token, { orderId: res.razorpay_order_id, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature })
          .then((r) => {
            setCreditBalance(r.balance);
            resolve({ status: "paid", balance: r.balance, credits: r.credits });
          })
          .catch(reject);
      },
      modal: { ondismiss: () => resolve({ status: "dismissed" }) },
    });
    // A failed attempt stays inside Checkout, which shows the reason and lets the person retry.
    checkout.open();
  });
}
