import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { NotchGlow } from "@/components/ui/NotchGlow";
import { Reveal } from "@/components/motion/Reveal";
import { ScaleToFit } from "@/components/motion/ScaleToFit";
import { cn } from "@/lib/utils";
import { empower } from "@/data/landing-page";
import {
  DiscoverVisual,
  OccasionsVisual,
  ScenesVisual,
  VoteVisual,
  SpeedVisual,
  ValueVisual,
  StoresVisual,
} from "./EmpowerVisuals";

const { speed, vote, scenes, value, discover } = empower.cards;

type Glow = { color: string; size: number; className: string };

function EmpowerCard({
  width,
  visualHeight,
  title,
  description,
  glows = [],
  className,
  delay = 0,
  children,
}: {
  width: number;
  visualHeight: number;
  title?: string;
  description?: string;
  glows?: Glow[];
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <Reveal delay={delay} y={40} className={cn("card-violet relative overflow-hidden rounded-(--radius-panel)", className)}>
      {glows.map((g, i) => (
        <div
          key={i}
          aria-hidden
          className={cn("pointer-events-none absolute rounded-full opacity-30 blur-[80px]", g.className)}
          style={{ width: g.size, height: g.size, background: g.color }}
        />
      ))}
      <ScaleToFit width={width} height={visualHeight} className="relative mx-auto" >
        {children}
      </ScaleToFit>
      {title && (
        <div className="relative px-6 pb-10 pt-3 text-center lg:pb-14 lg:pt-[22px]">
          <h3 className="text-h3 font-medium text-white">{title}</h3>
          <p className="mx-auto mt-3 max-w-[475px] text-sm text-muted sm:text-body lg:mt-[17px]">{description}</p>
        </div>
      )}
    </Reveal>
  );
}

export function Empower() {
  return (
    <section className="relative pt-[260px] [--notch-top:420px] [--s:0.62] [--tooth-w:140px] lg:pt-[380px] lg:[--notch-top:550px] lg:[--s:1] lg:[--tooth-w:232px]">
      <NotchGlow edge={false}>
        <div className="absolute inset-0">
          <div
            className="absolute left-1/2 top-[calc(var(--notch-top)+120px*var(--s))] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: "calc(690px * var(--s))",
              height: "calc(690px * var(--s))",
              // Teal hot-spot sits exactly on the boundary (33% down the dome),
              // shading out to a violet/magenta rim like the reference.
              background:
                "radial-gradient(circle calc(380px * var(--s)) at 50% 33%, #2ee8b0 0%, #20c6c8 20%, #3a6fe2 45%, #6645eb 68%, #9c4af7 88%, #c65eff 100%)",
              maskImage:
                "linear-gradient(180deg, transparent 2%, rgba(0,0,0,0.5) 18%, #000 30%), linear-gradient(90deg, rgba(0,0,0,0.35) 0%, #000 55%)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
          {[900, 1180].map((d) => (
            <div
              key={d}
              className="absolute left-1/2 top-[calc(var(--notch-top)+120px*var(--s))] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[inset_0_0_0_1px_rgba(120,110,255,0.14)]"
              style={{ width: `calc(${d}px * var(--s))`, height: `calc(${d}px * var(--s))` }}
            />
          ))}
          <div className="absolute left-1/2 top-(--notch-top) h-[calc(700px*var(--s))] w-[calc(1100px*var(--s))] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6645eb] opacity-15 blur-[120px]" />
        </div>
      </NotchGlow>

      <Container className="relative">
        <Reveal className="flex flex-col items-center text-center">
          <p className="text-body-lg text-cyan">{empower.eyebrow}</p>
          <h2 className="chrome mt-3 text-h1 font-medium">{empower.title}</h2>
        </Reveal>

        <div className="mt-[190px] flex flex-col gap-5 lg:mt-[240px] lg:gap-8">
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
            <EmpowerCard
              width={640}
              visualHeight={320}
              title={speed.title}
              description={speed.description}
              glows={[{ color: "#1fffec", size: 199, className: "-left-10 -top-24" }]}
            >
              <SpeedVisual />
            </EmpowerCard>
            <EmpowerCard
              width={640}
              visualHeight={320}
              title={vote.title}
              description={vote.description}
              delay={0.1}
              glows={[{ color: "#abb2fc", size: 177, className: "left-[90px] -bottom-24" }]}
            >
              <VoteVisual />
            </EmpowerCard>
          </div>

          <div className="grid gap-5 lg:grid-cols-[459px_1fr] lg:gap-8">
            <div className="grid gap-5 lg:gap-8">
              <EmpowerCard width={459} visualHeight={234} glows={[{ color: "#d61fff", size: 120, className: "-left-10 bottom-0" }]}>
                <StoresVisual />
              </EmpowerCard>
              <EmpowerCard width={459} visualHeight={234} delay={0.1} glows={[{ color: "#1f8fff", size: 120, className: "right-0 top-16" }]}>
                <OccasionsVisual />
              </EmpowerCard>
            </div>
            <EmpowerCard
              width={821}
              visualHeight={320}
              title={scenes.title}
              description={scenes.description}
              delay={0.15}
              glows={[{ color: "#1fffec", size: 199, className: "right-[60px] -bottom-28" }]}
            >
              <ScenesVisual />
            </EmpowerCard>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
            <EmpowerCard
              width={640}
              visualHeight={320}
              title={value.title}
              description={value.description}
              glows={[{ color: "#bf1fff", size: 177, className: "-left-16 -top-24" }]}
            >
              <ValueVisual />
            </EmpowerCard>
            <EmpowerCard
              width={640}
              visualHeight={320}
              title={discover.title}
              description={discover.description}
              delay={0.1}
              glows={[{ color: "#4658ff", size: 199, className: "left-1/3 -top-28" }]}
            >
              <DiscoverVisual />
            </EmpowerCard>
          </div>
        </div>
      </Container>
    </section>
  );
}
