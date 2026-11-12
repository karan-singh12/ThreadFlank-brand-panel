"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/LogoMark";
import { Notice } from "@/components/ui/Controls";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { pricing } from "@/data/landing-page";
import { pricingContent } from "@/data/site-content";
import { billingApi, refreshWallet, useWallet, type Catalogue, type CreditPack } from "./api";
import { buyPack } from "./checkout";

const copy = pricingContent.credits;
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Live packs and free allowance from the API; the built-in defaults show until it answers. */
export function useCatalogue(): Catalogue {
  const [catalogue, setCatalogue] = useState<Catalogue>(copy.fallback);
  useEffect(() => {
    let live = true;
    billingApi
      .catalogue()
      .then((c) => live && c?.packs && setCatalogue(c))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return catalogue;
}

/**
 * The shopper offer: the free allowance plus every credit pack on sale. Signed-out visitors
 * go to sign-up; signed-in people pay in Razorpay Checkout (or see “Coming soon” until
 * payments are switched on).
 */
export function CreditOffers({ className }: { className?: string }) {
  const catalogue = useCatalogue();
  const { status, user, token } = useAuth();
  const signedIn = status === "authenticated";
  const wallet = useWallet();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const buy = async (pack: CreditPack) => {
    if (!token) return;
    setBusy(pack.id);
    setNotice(null);
    try {
      const res = await buyPack(token, pack, { email: user?.email, name: user?.username ?? undefined });
      if (res.status === "paid") setNotice({ tone: "success", text: copy.paid(res.credits, res.balance) });
    } catch (e) {
      setNotice({ tone: "error", text: e instanceof Error ? e.message : String(e) });
      refreshWallet();
    } finally {
      setBusy(null);
    }
  };

  const count = catalogue.packs.length + 1;
  return (
    <div className={className}>
      {signedIn && wallet && (
        <p className="mb-6 text-center text-sm text-subtle">
          {copy.balance(wallet.balance)}
        </p>
      )}
      {notice && (
        <div className="mx-auto mb-6 max-w-[560px]">
          <Notice tone={notice.tone}>{notice.text}</Notice>
        </div>
      )}
      <div
        className={cn(
          "relative mx-auto grid max-w-[360px] gap-10 lg:items-stretch lg:gap-5 xl:gap-6",
          count >= 4 ? "lg:max-w-none lg:grid-cols-4" : count === 3 ? "lg:max-w-none lg:grid-cols-3" : "md:max-w-[740px] md:grid-cols-2"
        )}
      >
        <OfferCard
          name={copy.free.name}
          price={0}
          note={pricing.notes.free}
          blurb={copy.free.blurb(catalogue.freeCredits)}
          features={copy.free.features(catalogue.freeCredits)}
          action={
            signedIn ? (
              <span className="flex h-12 items-center justify-center rounded-full border border-white/12 text-sm text-muted">{copy.free.signedIn}</span>
            ) : (
              <Button href="/signup?next=/pricing" variant="light" className="w-full">
                {copy.free.cta}
              </Button>
            )
          }
        />
        {catalogue.packs.map((pack) => (
          <OfferCard
            key={pack.id}
            name={pack.name}
            price={pack.price}
            featured={pack.featured}
            note={`${copy.perLook(pack.price / pack.credits)} · ${copy.oneTime}`}
            blurb={pack.description || `${pack.credits} ${copy.looks}`}
            features={copy.packFeatures(pack.credits, catalogue.videoCost)}
            action={
              !signedIn ? (
                <Button href={`/signup?next=/pricing&plan=${pack.id}`} variant={pack.featured ? "primary" : "light"} className="w-full">
                  {copy.buy(pack.name)}
                </Button>
              ) : !catalogue.paymentsEnabled ? (
                <span className="flex h-12 items-center justify-center rounded-full border border-white/12 text-sm text-muted">{copy.comingSoon}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => buy(pack)}
                  disabled={Boolean(busy)}
                  className={cn(
                    "flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:translate-y-0 disabled:opacity-60",
                    pack.featured ? "btn-primary" : "btn-light"
                  )}
                >
                  {busy === pack.id && <LoaderCircle className="size-4 animate-spin" />}
                  {busy === pack.id ? copy.paying : copy.buy(pack.name)}
                </button>
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

function OfferCard({
  name,
  price,
  note,
  blurb,
  features,
  featured = false,
  action,
}: {
  name: string;
  price: number;
  note: string;
  blurb: string;
  features: string[];
  featured?: boolean;
  action: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl px-7 pb-7 text-center sm:px-8 sm:pb-8",
        featured
          ? "bg-[linear-gradient(180deg,rgba(102,69,235,0.24)_0%,#010214_100%)] pt-14 shadow-[inset_0_0_0_1px_rgba(124,92,255,0.4),0_30px_80px_-30px_rgba(102,69,235,0.55)]"
          : "bg-[linear-gradient(180deg,rgba(34,32,39,0.5)_0%,#010214_100%)] pt-10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] lg:mt-6"
      )}
    >
      {featured && <LogoMark halo className="absolute left-1/2 top-[-28px] size-[64px] -translate-x-1/2" />}
      <div className="flex items-center justify-center gap-2">
        <p className="text-body uppercase tracking-[0.04em] text-cyan">{name}</p>
        {featured && (
          <span className="rounded-full bg-accent/25 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#c9bcff] ring-1 ring-accent-bright/40">
            {copy.best}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-end justify-center gap-2">
        <span className={cn("text-[3.25rem] font-medium leading-none tracking-[-0.04em] sm:text-[3.75rem]", featured ? "chrome-soft" : "chrome")}>{rupees(price)}</span>
        {price > 0 && <span className="pb-1.5 text-sm text-dim">{pricing.unitOnce}</span>}
      </div>
      <p className="mt-3 flex min-h-6 items-center justify-center text-sm text-muted">{note}</p>
      <p className="mt-5 text-body-lg text-ink-soft">{blurb}</p>
      <ul className="mt-7 flex flex-col gap-3.5 border-t border-white/8 pt-7 text-left">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[15px] leading-snug text-ink-soft">
            <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/4">
              <Check className="size-3" strokeWidth={2.5} />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-10 lg:mt-auto lg:pt-10">{action}</div>
    </div>
  );
}
