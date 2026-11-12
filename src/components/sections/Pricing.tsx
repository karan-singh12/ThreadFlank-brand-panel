"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { CreditOffers } from "@/features/billing/CreditOffers";
import { pricing } from "@/data/landing-page";
import { pricingContent } from "@/data/site-content";

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

/** Shopper credit packs — the same live offer as the /pricing page, so the two never disagree. */
export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-x-clip pt-40 lg:pt-[370px]">
      <Meridians className="pointer-events-none absolute left-1/2 top-[40px] w-[900px] -translate-x-1/2 [mask-image:linear-gradient(180deg,#000_20%,transparent_60%)] lg:top-[250px] lg:w-[1300px]" />

      <Container className="relative">
        <SectionHeading eyebrow={pricing.eyebrow} title={pricing.title}>
          <p className="mt-3 max-w-[700px] text-sm text-subtle sm:text-body">{pricingContent.description}</p>
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
            <CreditOffers />
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
