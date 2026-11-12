import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ScaleToFit } from "@/components/motion/ScaleToFit";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { forBrands } from "@/data/landing-page";
import { Orbit } from "./Orbit";

type Segment = { text: string; strong: boolean };

function Highlighted({ segments, className }: { segments: Segment[]; className?: string }) {
  return (
    <p className={cn("mx-auto max-w-[700px] text-center text-lead text-muted", className)}>
      {segments.map((s, i) => (s.strong ? <span key={i} className="text-white">{s.text}</span> : <span key={i}>{s.text}</span>))}
    </p>
  );
}

// Card offsets inside the pinned track (kept shorter than the reference so the section doesn't drag).
const TRACK_H = 2500;
const CARD_TOPS = [820, 1360, 1900];

function FeatureCard({ card }: { card: (typeof forBrands.cards)[number] }) {
  return (
    <div className="card-violet-strong rounded-(--radius-card) px-10 py-10 backdrop-blur-md lg:w-[320px]">
      <p className="flex items-center gap-3 text-title text-white">
        <Icon name={card.icon} className="size-7" strokeWidth={1.5} />
        {card.title}
      </p>
      <p className="mt-4 text-sm text-muted sm:text-body">{card.description}</p>
    </div>
  );
}

/** "For brands": the try-on widget pitch around the orbit. */
export function Integration() {
  return (
    <section id="brands" className="relative pt-40 lg:pt-[444px]">
      <Container>
        <SectionHeading eyebrow={forBrands.eyebrow} title={forBrands.title} />
        <Reveal delay={0.1}>
          <Highlighted segments={forBrands.intro} className="mt-20 lg:mt-[120px]" />
        </Reveal>

        {/* Desktop: orbit pinned while the feature cards scroll past it. */}
        <div className="relative mt-[180px] hidden xl:block" style={{ height: TRACK_H }}>
          <div className="sticky top-0 flex h-screen items-center justify-center">
            <Orbit />
          </div>
          {forBrands.cards.map((card, i) => (
            <Reveal
              key={card.title}
              y={60}
              className={cn("absolute", card.side === "left" ? "left-[100px]" : "right-[100px]")}
              style={{ top: CARD_TOPS[i] }}
            >
              <FeatureCard card={card} />
            </Reveal>
          ))}
        </div>

        {/* Mobile / tablet: orbit, then cards stacked. */}
        <div className="mt-16 xl:hidden">
          <ScaleToFit width={840} height={840} className="mx-auto max-w-[520px]">
            <Orbit />
          </ScaleToFit>
          <div className="mx-auto mt-10 flex max-w-[520px] flex-col gap-6">
            {forBrands.cards.map((card) => (
              <Reveal key={card.title}>
                <FeatureCard card={card} />
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal>
          <Highlighted segments={forBrands.outro} className="mt-24 lg:mt-[120px]" />
        </Reveal>
        <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-5 lg:mt-14">
          <Button href={forBrands.primaryCta.href}>{forBrands.primaryCta.label}</Button>
          <Button href={forBrands.secondaryCta.href} variant="light">
            {forBrands.secondaryCta.label}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
