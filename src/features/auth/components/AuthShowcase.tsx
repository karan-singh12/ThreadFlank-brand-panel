import { Check } from "lucide-react";
import { DotArc } from "@/components/ui/DotArc";
import { LogoMark } from "@/components/ui/LogoMark";
import { Art } from "@/components/ui/Art";
import { ArcGlow } from "@/components/hero/ArcGlow";
import { authContent } from "@/data/auth-content";

const { showcase } = authContent;

export function AuthShowcase() {
  return (
    <aside
      aria-hidden
      className="relative hidden overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,#050621_0%,#0a0b35_55%,#070820_100%)] lg:sticky lg:top-4 lg:flex lg:h-[calc(100dvh-2rem)] lg:min-h-[640px] lg:flex-col [--cy:300px] [--s:0.85]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] [mask-image:linear-gradient(180deg,#000_60%,transparent)]">
        <ArcGlow />
      </div>

      {/* Arc and copy take the free height (the arc stays at the top, under its glow); spacing tightens on short screens and the testimonial only shows when there is room, so nothing is cut off. */}
      <div className="flex flex-1 flex-col">
        <div className="relative mx-auto mt-6 w-[500px] [@media(min-height:860px)]:mt-[48px]">
          <DotArc />
          <div className="absolute left-1/2 top-[93.75%] size-[88px] -translate-x-1/2 -translate-y-1/2">
            <LogoMark halo className="size-full drop-shadow-[0_0_30px_rgba(102,69,235,0.8)]" />
          </div>
        </div>

        <div className="relative mt-10 px-12 text-center [@media(min-height:860px)]:mt-16">
          <p className="text-body-lg text-cyan">{showcase.eyebrow}</p>
          {/* One line, to keep the panel short enough that nothing is cut off. */}
          <h2 className="mt-3 text-[clamp(2.25rem,1.25rem+1.8vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.04em]">
            <span className="chrome-soft">{showcase.title[0]}</span> <span className="chrome-dim">{showcase.title[1]}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[420px] text-body text-muted">{showcase.description}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 [@media(min-height:860px)]:mt-7">
            {showcase.pills.map((pill) => (
              <span key={pill} className="glass-pill flex h-9 items-center gap-2 rounded-[44px] px-4 text-sm text-white">
                <Check className="size-3.5" strokeWidth={2} />
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <figure className="card-violet relative mx-10 mb-10 hidden rounded-2xl p-6 backdrop-blur-md [@media(min-height:860px)]:block">
        <blockquote className="text-body leading-relaxed text-ink-soft">“{showcase.testimonial.quote}”</blockquote>
        <figcaption className="mt-5 flex items-center gap-3">
          <Art image={showcase.testimonial.image} tone={showcase.testimonial.tone} className="size-10 rounded-full" sizes="40px" />
          <div>
            <p className="text-sm text-white">{showcase.testimonial.name}</p>
            <p className="text-xs text-muted">{showcase.testimonial.handle}</p>
          </div>
        </figcaption>
      </figure>
    </aside>
  );
}
