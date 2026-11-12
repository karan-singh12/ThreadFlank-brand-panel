"use client";

import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { DotArc } from "@/components/ui/DotArc";
import { LogoMark } from "@/components/ui/LogoMark";
import { Reveal } from "@/components/motion/Reveal";
import { ArcGlow } from "@/components/hero/ArcGlow";
import { finalCta } from "@/data/landing-page";
import { useAuth } from "@/features/auth/AuthProvider";

export function FinalCta() {
  const { status } = useAuth();
  const primary = status === "authenticated" ? finalCta.signedInPrimaryCta : finalCta.primaryCta;

  return (
    <section
      id="get-started"
      className="relative mt-32 overflow-hidden [--cy:360px] [--s:0.72] lg:mt-[170px] lg:[--cy:520px] lg:[--s:1]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[calc(var(--cy)+140px*var(--s))] [mask-image:linear-gradient(180deg,#000_60%,transparent)]"
      >
        <ArcGlow sweep={false} />
        <div className="absolute left-1/2 top-(--cy) size-[calc(353px*var(--s))] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,rgba(181,190,247,0.19),rgba(135,140,255,0))]" />
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
        <div className="absolute left-1/2 top-(--cy) w-[min(480px,calc(100vw+90px))] -translate-x-1/2 -translate-y-[93.75%] [mask-image:linear-gradient(180deg,#000_55%,transparent_95%)] lg:w-[620px]">
          <DotArc />
        </div>
        <div className="absolute left-1/2 top-[calc(var(--cy)-12px)] size-[calc(110px*var(--s))] -translate-x-1/2 -translate-y-1/2">
          <LogoMark halo className="size-full drop-shadow-[0_0_30px_rgba(102,69,235,0.8)]" />
        </div>
      </div>

      <Container className="relative flex flex-col items-center pt-[calc(var(--cy)+72px*var(--s))] text-center">
        <Reveal>
          <h2 className="mx-auto max-w-[340px] text-h1 font-medium sm:max-w-none">
            <span className="chrome-soft block">{finalCta.title[0]}</span>
            <span className="chrome-dim block">{finalCta.title[1]}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-[900px] text-body text-muted sm:text-body-lg lg:mt-[20px]">{finalCta.description}</p>
        </Reveal>
        <Reveal delay={0.2} className="mt-10 flex items-center gap-3 sm:gap-5 lg:mt-[56px]">
          <Button href={primary.href}>{primary.label}</Button>
          <Button href={finalCta.secondaryCta.href} variant="light">
            {finalCta.secondaryCta.label}
          </Button>
        </Reveal>
      </Container>
      <div className="h-[140px] lg:h-[160px]" />
    </section>
  );
}
