import { Container } from "@/components/ui/Container";
import { Marquee } from "@/components/motion/Marquee";
import { Reveal } from "@/components/motion/Reveal";
import { ScaleToFit } from "@/components/motion/ScaleToFit";
import { Icon } from "@/lib/icons";
import { howItWorks } from "@/data/landing-page";
import { DecideVisual, LooksVisual, TwinVisual } from "./GrowthVisuals";

const VISUALS: Record<string, () => React.ReactElement> = {
  twin: TwinVisual,
  looks: LooksVisual,
  decide: DecideVisual,
};

/** "How it works": the three steps from selfie to a decided look. */
export function Growth() {
  return (
    <section id="how" className="relative pt-32 lg:pt-[164px]">
      <Bowl />

      <Container className="relative">
        <Reveal className="flex flex-col items-center pt-[150px] text-center lg:pt-[293px]">
          <p className="text-body-lg text-cyan">{howItWorks.eyebrow}</p>
          <h2 className="mt-3 max-w-[360px] text-h1 font-medium sm:max-w-none">
            <span className="chrome-soft block">{howItWorks.title[0]}</span>
            <span className="chrome-dim block">{howItWorks.title[1]}</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-10 w-full max-w-[370px] lg:mt-[45px]">
          <Marquee duration={18} gap={24} className="fade-x">
            {howItWorks.tools.map((icon) => (
              <span
                key={icon}
                className="flex size-[72px] items-center justify-center rounded-full border-2 border-[#6b55d8]/35 bg-[radial-gradient(circle_at_50%_30%,#2a2168,#0c0a26)]"
              >
                <Icon name={icon} className="size-7 text-white" strokeWidth={2} />
              </span>
            ))}
          </Marquee>
        </Reveal>

        <div className="mt-24 flex flex-col gap-28 lg:mt-[169px] lg:gap-[288px]">
          {howItWorks.steps.map((feature) => {
            const Visual = VISUALS[feature.id];
            return (
              <div key={feature.id} className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[656px_1fr] xl:gap-[108px]">
                <Reveal y={48} className="min-w-0">
                  <ScaleToFit width={656} height={592}>
                    <div className="relative h-[592px] w-[656px] overflow-hidden rounded-(--radius-frame) bg-[linear-gradient(160deg,#141236_0%,#0f0e2a_55%,#0c0b20_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                      <Visual />
                    </div>
                  </ScaleToFit>
                </Reveal>
                <Reveal delay={0.1} className="max-w-[508px] xl:max-w-none">
                  <p className="flex items-center gap-3 text-body-lg text-cyan">
                    <Icon name={feature.eyebrowIcon} className="size-6" strokeWidth={1.75} />
                    {feature.eyebrow}
                  </p>
                  <h3 className="mt-6 text-h2 font-medium text-white lg:mt-[30px]">{feature.title}</h3>
                  <p className="mt-6 text-body text-muted sm:text-body-lg lg:mt-[30px]">{feature.description}</p>
                </Reveal>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/** Curved light "bowl" hovering above the heading. */
function Bowl() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 flex justify-center overflow-hidden">
      <div className="h-[290px] w-[860px] shrink-0 origin-top scale-[0.55] sm:scale-75 lg:scale-100">
        <div
          className="size-full bg-[linear-gradient(90deg,#2c73d8_0%,#3f66e4_45%,#5a4fe8_75%,#6b45e6_100%)] [clip-path:path('M0_0Q430_58_860_0L860_290L0_290Z')] [mask-image:linear-gradient(180deg,#000_0%,rgba(0,0,0,0.45)_35%,transparent_95%),linear-gradient(90deg,transparent,#000_22%,#000_78%,transparent)] [mask-composite:intersect]"
        />
      </div>
    </div>
  );
}
