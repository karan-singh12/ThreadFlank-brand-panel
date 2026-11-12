import { Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/lib/icons";
import { featureDetails } from "@/data/landing-page";

/** Feature-by-feature breakdown: one glass card per area of the app. */
export function FeatureDetails() {
  return (
    <section id="feature-details" className="pt-28 lg:pt-[200px]">
      <Container>
        <SectionHeading eyebrow={featureDetails.eyebrow} title={featureDetails.title} />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {featureDetails.groups.map((g, i) => (
            <Reveal key={g.title} y={28} delay={(i % 3) * 0.08}>
              <article className="card-violet h-full rounded-(--radius-panel) p-6 transition-transform duration-500 ease-(--ease-premium) hover:-translate-y-1.5 sm:p-7">
                <span className="keycap flex size-12 items-center justify-center rounded-2xl">
                  <Icon name={g.icon} className="icon-silver size-6" strokeWidth={1.75} />
                </span>
                <h3 className="chrome-soft mt-5 text-h3 font-medium">{g.title}</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {g.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm leading-snug text-ink-soft">
                      <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/4">
                        <Check className="size-3" strokeWidth={2.5} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
