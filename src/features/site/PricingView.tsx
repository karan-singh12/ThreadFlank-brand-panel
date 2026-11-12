"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { LogoMark } from "@/components/ui/LogoMark";
import { EASE } from "@/components/motion/Reveal";
import { CreditOffers } from "@/features/billing/CreditOffers";
import { cn } from "@/lib/utils";
import { pricingContent as copy, type Plan } from "@/data/site-content";

type Audience = "shoppers" | "brands";
type Period = "monthly" | "yearly";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Toggle<T extends string>({ value, onChange, options, id }: { value: T; onChange: (v: T) => void; options: readonly { id: string; label: string }[]; id: string }) {
  return (
    <div role="tablist" className="flex h-11 items-center rounded-full bg-[rgba(173,156,242,0.1)] p-[3px]">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id as T)}
            className={cn("relative h-[38px] min-w-[104px] rounded-full px-4 text-sm font-medium transition-colors duration-300", active ? "text-canvas" : "text-[#bbbbbb] hover:text-white")}
          >
            {active && (
              <motion.span layoutId={`${id}-thumb`} className="absolute inset-0 rounded-full bg-white" transition={{ duration: 0.4, ease: EASE }} />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PricingView() {
  // /pricing?for=brands opens on the brand plans (linked from the landing page).
  const params = useSearchParams();
  const [audience, setAudience] = useState<Audience>(params.get("for") === "brands" ? "brands" : "shoppers");
  const [period, setPeriod] = useState<Period>("yearly");
  // Shoppers buy one-time credit packs; brands keep monthly / yearly plans.
  const plans = copy.brands;

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-12 sm:px-8 lg:py-16">
      <header className="mx-auto max-w-[640px] text-center">
        <h1 className="chrome text-h2 font-medium">{copy.title}</h1>
        <p className="mt-3 text-body text-subtle">{copy.description}</p>
      </header>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Toggle id="audience" value={audience} onChange={setAudience} options={copy.audiences} />
        {audience === "brands" && (
          <div className="flex items-center gap-2">
            <Toggle id="period" value={period} onChange={setPeriod} options={copy.periods} />
            <span className="rounded-full border border-green px-2 text-xs text-green">{copy.yearlyNote}</span>
          </div>
        )}
      </div>

      {audience === "shoppers" ? (
        <CreditOffers className="mx-auto mt-16 max-w-[1100px]" />
      ) : (
        <div className={cn("mx-auto mt-16 grid gap-6", plans.length === 3 ? "max-w-[1100px] lg:grid-cols-3" : "max-w-[740px] md:grid-cols-2")}>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} period={period} />
          ))}
        </div>
      )}

      <section className="mx-auto mt-24 max-w-[720px]">
        <h2 className="chrome text-h3 font-medium">{copy.faqTitle}</h2>
        <div className="mt-6 flex flex-col gap-3">
          {copy.faq.map((item) => (
            <details key={item.q} className="card-violet group rounded-(--radius-card) px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-body text-white">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-subtle">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

/** A brand plan; these are arranged with our team, so the button opens a brand enquiry. */
function PlanCard({ plan, period }: { plan: Plan; period: Period }) {
  const price = plan.once ?? (period === "yearly" ? plan.yearly : plan.monthly);
  const suffix = plan.once ? copy.oneTime : price ? copy.perMonth : "";
  const href = `/contact?topic=brands&plan=${plan.id}`;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl px-7 pb-7 pt-10",
        plan.featured
          ? "bg-[linear-gradient(180deg,rgba(102,69,235,0.22)_0%,#010214_100%)] shadow-[inset_0_0_0_1px_rgba(124,92,255,0.35)]"
          : "bg-[linear-gradient(180deg,rgba(34,32,39,0.5)_0%,#010214_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
      )}
    >
      {plan.featured && (
        <>
          <LogoMark halo className="absolute left-1/2 top-[-24px] size-12 -translate-x-1/2" />
          <span className="absolute right-5 top-5 rounded-full bg-accent/25 px-2.5 py-0.5 text-xs text-white">{copy.popular}</span>
        </>
      )}
      <p className="text-sm uppercase tracking-[0.08em] text-cyan">{plan.name}</p>
      <p className="mt-1 text-sm text-muted">{plan.blurb}</p>

      <div className="mt-6 flex items-end gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${plan.id}-${price}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={cn("text-[2.75rem] font-medium leading-none tracking-[-0.03em]", plan.featured ? "chrome-soft" : "chrome")}
          >
            {price === null ? copy.custom : rupees(price)}
          </motion.span>
        </AnimatePresence>
        {suffix && <span className="pb-1 text-sm text-dim">{suffix}</span>}
      </div>
      <p className="mt-2 h-4 text-xs text-muted">{!plan.once && period === "yearly" && price ? copy.billedYearly : ""}</p>

      <ul className="mt-8 flex flex-1 flex-col gap-3.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm text-ink-soft">
            <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border border-white/25">
              <Check className="size-3" strokeWidth={2.5} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={cn(
          "mt-8 flex h-12 items-center justify-center rounded-full text-sm font-medium transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-110",
          plan.featured ? "btn-primary" : "btn-light"
        )}
      >
        {plan.cta}
      </Link>
    </div>
  );
}
