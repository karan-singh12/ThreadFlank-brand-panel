"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { pricing } from "@/data/landing-page";
import { pricingContent, type Plan } from "@/data/site-content";

/** Meridian lines of a sphere, used behind the heading and across the planet glow. */
function Meridians({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1300 700" className={className} aria-hidden fill="none" stroke="rgba(150,150,220,0.14)">
      {[640, 470, 290, 110].map((rx) => (
        <ellipse key={rx} cx="650" cy="650" rx={rx} ry="640" />
      ))}
    </svg>
  );
}

/** Brand plans — read from the same content as the /pricing page, so the two never disagree. */
export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-x-clip pt-40 lg:pt-[370px]">
      <Meridians className="pointer-events-none absolute left-1/2 top-[40px] w-[900px] -translate-x-1/2 [mask-image:linear-gradient(180deg,#000_20%,transparent_60%)] lg:top-[250px] lg:w-[1300px]" />

      <Container className="relative">
        <SectionHeading eyebrow={pricing.eyebrow} title={pricing.title}>
          <p className="mt-3 max-w-[700px] text-sm text-subtle sm:text-body">Put try-on on your product pages and your catalog in front of shoppers. Pick a plan, or talk to us about white-label.</p>
        </SectionHeading>

        <div className="relative mx-auto mt-16 max-w-[1100px] lg:mt-[96px]">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-568px] hidden size-[1282px] -translate-x-1/2 overflow-hidden rounded-full xl:block"
            style={{
              background:
                "linear-gradient(180deg, transparent 68%, rgba(102,69,235,0.3) 84%, #8d3ff2 92%, #d56cff 97%, #ffffff 100%)",
            }}
          >
            <Meridians className="absolute inset-x-0 bottom-0 w-full opacity-60" />
          </div>

          <Reveal delay={0.1} y={48}>
            <ul className="grid gap-5 md:grid-cols-2">
              {(pricingContent.brands as Plan[]).map((plan) => (
                <li key={plan.id} className={cn("flex flex-col rounded-(--radius-panel) p-7 ring-1", plan.featured ? "bg-white/[0.06] ring-accent-bright/50" : "bg-white/[0.03] ring-white/10")}>
                  <h3 className="text-xl font-medium text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
                  <p className="mt-5 text-h2 font-medium text-white">
                    {plan.monthly == null ? pricingContent.custom : `₹${(plan.yearly ?? plan.monthly).toLocaleString("en-IN")}`}
                    {plan.monthly != null && <span className="ml-1 text-sm font-normal text-muted">{pricingContent.perMonth}, {pricingContent.billedYearly}</span>}
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-subtle">
                        <Check className="mt-0.5 size-4 shrink-0 text-accent-bright" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.monthly == null ? "/contact?topic=brands" : "/signup"} className="btn-primary mt-7 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium">
                    {plan.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="mt-12 flex justify-center xl:mt-[128px]">
          <Link href={pricing.allPlans.href} className="group inline-flex items-center gap-2 text-body text-subtle transition-colors hover:text-white">
            {pricing.allPlans.label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
