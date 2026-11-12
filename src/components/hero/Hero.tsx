"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { DotArc } from "@/components/ui/DotArc";
import { NotchGlow } from "@/components/ui/NotchGlow";
import { EASE } from "@/components/motion/Reveal";
import { hero } from "@/data/landing-page";
import { useAuth } from "@/features/auth/AuthProvider";
import { ArcGlow } from "./ArcGlow";
import { HeroEmblem } from "./HeroEmblem";
import { Starfield } from "./Starfield";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: EASE, delay },
});

export function Hero() {
  const { status } = useAuth();
  const primary = status === "authenticated" ? hero.signedInPrimaryCta : hero.primaryCta;

  return (
    <section
      id="top"
      className="relative [--notch-top:330px] [--s:0.72] [--tooth-w:0px] lg:[--notch-top:432px] lg:[--s:1] lg:[--tooth-w:0px]"
    >
      <NotchGlow edge={false}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#040520_0%,#080a2e_100%)]" style={{ ["--cy" as string]: "var(--notch-top)" }}>
          <ArcGlow sweep={false} />
        </div>
      </NotchGlow>

      <div className="pointer-events-none absolute inset-x-0 top-0" aria-hidden>
        {/* White-light boundary: brightest under the logo, fading out toward the sides. */}
        <div
          className="absolute inset-x-0 h-px"
          style={{
            top: "var(--notch-top)",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 18%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.14) 82%, transparent 100%)",
            boxShadow: "0 0 18px 1px rgba(255,255,255,0.28)",
          }}
        />
        {/* Clipped, so shooting stars never stretch the page sideways on phones. */}
        <div className="absolute inset-x-0 top-0 h-(--notch-top) overflow-hidden">
          <Starfield />
        </div>
        <div className="absolute inset-x-0 top-0 h-(--notch-top) overflow-hidden">
          <div className="absolute left-1/2 top-(--notch-top) w-[min(480px,calc(100vw+90px))] -translate-x-1/2 -translate-y-[93.75%] lg:w-[620px]">
            <DotArc interactive />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          className="absolute left-1/2 top-[calc(var(--notch-top)-12px)] -ml-[calc(50px*var(--s))] -mt-[calc(50px*var(--s))] size-[calc(100px*var(--s))]"
        >
          {[0, 1.8].map((delay) => (
            <span
              key={delay}
              className="absolute inset-0 rounded-full border border-white/50"
              style={{ animation: `logo-pulse 3.6s ease-out ${delay}s infinite` }}
            />
          ))}
          <HeroEmblem className="size-full" />
          {/* White-light ring on the emblem's edge. */}
          <span className="absolute inset-0 rounded-full border border-white/80 shadow-[0_0_22px_rgba(255,255,255,0.45),inset_0_0_14px_rgba(255,255,255,0.25)]" />
        </motion.div>
      </div>

      <Container className="relative flex flex-col items-center pt-[calc(var(--notch-top)+96px)] text-center lg:pt-[calc(var(--notch-top)+83px)]">
        <motion.div
          {...rise(0.3)}
          className="order-2 mt-6 max-w-[360px] text-body text-muted sm:max-w-[520px] sm:text-body-lg lg:order-1 lg:mt-0 lg:grid lg:max-w-[1072px] lg:grid-cols-2 lg:gap-[212px]"
        >
          <p className="inline text-pretty lg:block">{hero.leftBlurb} </p>
          <p className="inline text-pretty lg:block">{hero.rightBlurb}</p>
        </motion.div>

        <motion.h1
          {...rise(0.15)}
          className="chrome order-1 max-w-[340px] text-display font-medium sm:max-w-none lg:order-2 lg:mt-4"
        >
          {hero.title}
        </motion.h1>

        <motion.div {...rise(0.45)} className="order-3 mt-8 flex items-center gap-3 sm:gap-5 lg:mt-12">
          <Button href={primary.href}>{primary.label}</Button>
          <Button href={hero.secondaryCta.href} variant="light">
            {hero.secondaryCta.label}
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}
