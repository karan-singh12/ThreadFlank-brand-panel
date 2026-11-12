"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Plus, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Art } from "@/components/ui/Art";
import { Reveal, EASE } from "@/components/motion/Reveal";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { features, type FeatureCard } from "@/data/landing-page";

/** Feature tabs (Try-on / Wardrobe / Together), each with three pin cards. */
export function Artistry() {
  const [active, setActive] = useState(0);
  const tab = features.tabs[active];

  return (
    <section id="features" className="relative overflow-x-clip pt-40 lg:pt-[310px]">
      <Container className="relative">
        <SectionHeading eyebrow={features.eyebrow} title={features.title} />

        <Reveal delay={0.1} className="mt-12 flex justify-center lg:mt-20">
          <div role="tablist" aria-label="Feature groups" className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
            {features.tabs.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`feature-tab-${t.id}`}
                aria-selected={i === active}
                aria-controls="feature-panel"
                onClick={() => setActive(i)}
                className={cn(
                  "flex h-12 items-center gap-2.5 rounded-full border px-5 text-body transition-colors duration-300",
                  i === active
                    ? "border-[#6f55ff]/70 bg-[linear-gradient(93deg,rgba(88,52,235,0.25),rgba(122,126,231,0))] text-white"
                    : "border-white/12 text-subtle hover:border-white/25 hover:text-white"
                )}
              >
                <Icon name={t.icon} className="size-6" strokeWidth={1.75} />
                {t.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div
          id="feature-panel"
          role="tabpanel"
          aria-labelledby={`feature-tab-${tab.id}`}
          className="relative mx-auto mt-16 max-w-[330px] lg:mt-20 lg:max-w-none xl:px-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-90px] h-[306px] w-[324px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#f457ff,#5324ff)] opacity-45 blur-[120px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-[-150px] left-1/2 h-[276px] w-[456px] -translate-x-1/2 rounded-full bg-[linear-gradient(290deg,#6645eb_11%,#1fc5db)] opacity-20 blur-[120px]"
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="relative flex flex-col gap-8 lg:flex-row lg:justify-between"
            >
              {tab.cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 48 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
                  className={cn("lg:w-[275px]", i === 1 && "lg:mt-[72px]")}
                >
                  <PinCard card={card}>
                    <CardVisual id={card.id} />
                  </PinCard>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}

function PinCard({ card, children }: { card: FeatureCard; children: ReactNode }) {
  return (
    <div className="relative h-[353px] overflow-hidden rounded-(--radius-card) bg-[linear-gradient(144deg,rgba(160,112,255,0.2)_0%,#010214_100%)] shadow-[inset_0_0_0_1px_rgba(170,140,255,0.18)] transition-transform duration-500 ease-(--ease-premium) hover:-translate-y-1.5">
      <div className="absolute inset-x-[26px] top-[26px] h-[190px] overflow-hidden rounded-md border border-white/12 [mask-image:linear-gradient(180deg,#000_60%,transparent)]">
        {children}
      </div>
      <div className="absolute inset-x-0 bottom-0 top-[210px] bg-[#05061a]/55" />
      <Pin icon={card.icon} />
      <div className="absolute inset-x-4 top-[243px] text-center">
        <h3 className="text-title text-white">{card.title}</h3>
        <p className="mx-auto mt-2 max-w-[243px] text-sm text-muted">{card.description}</p>
      </div>
    </div>
  );
}

function Pin({ icon }: { icon: string }) {
  return (
    <div className="absolute left-1/2 top-[158px] size-[83px] -translate-x-1/2">
      <svg viewBox="0 0 83 96" className="absolute inset-0 h-[96px] w-[83px]" aria-hidden>
        <path d="M41.5 0C64.4 0 83 18.6 83 41.5c0 18-11.5 33.3-27.5 39L41.5 96 27.5 80.5C11.5 74.8 0 59.5 0 41.5 0 18.6 18.6 0 41.5 0Z" fill="#6645eb" />
        <ellipse cx="41.5" cy="22" rx="30" ry="16" fill="white" opacity="0.08" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white">
        <Icon name={icon} className="size-8" strokeWidth={2} />
      </span>
    </div>
  );
}

// ─── Card illustrations (drawn in the 223×190 window above each pin) ────────

function CardVisual({ id }: { id: string }) {
  switch (id) {
    case "link":
      return <LinkVisual />;
    case "poses":
      return <PosesVisual />;
    case "scenes":
      return <ScenesVisual />;
    case "closet":
      return <ClosetVisual />;
    case "combos":
      return <ComboVisual />;
    case "value":
      return <ValueVisual />;
    case "circle":
      return <CircleVisual />;
    case "events":
      return <EventVisual />;
    case "vote":
      return <VoteVisual />;
    default:
      return null;
  }
}

function GarmentTile({ src, className }: { src: string; className?: string }) {
  return <Art image={src} className={cn("rounded-lg bg-white ring-1 ring-white/20", className)} sizes="80px" />;
}

function LinkVisual() {
  return (
    <div className="relative flex size-full flex-col items-center px-3 pt-4">
      <div className="flex h-8 w-full items-center gap-2 rounded-full bg-white/8 px-3 text-[11px] text-subtle ring-1 ring-white/10">
        <Icon name="link" className="size-3.5 shrink-0 text-[#a99bff]" />
        <span className="truncate">Paste a product link…</span>
      </div>
      <ArrowDown className="mt-1.5 size-4 text-[#7c5cff]" />
      <div className="relative mt-1.5">
        <GarmentTile src="/images/trench_coat.png" className="size-[70px]" />
        <span className="absolute -right-3 -top-2 flex size-7 items-center justify-center rounded-full bg-[#6645eb] shadow-[0_0_20px_rgba(102,69,235,0.8)]">
          <Sparkles className="size-3.5 text-white" />
        </span>
      </div>
    </div>
  );
}

function PosesVisual() {
  return (
    <div className="flex size-full items-start justify-center gap-2 px-3 pt-4">
      {features.poses.map((p) => (
        <figure key={p.label} className="w-[62px]">
          <Art image={p.image} className={cn("h-[92px] rounded-lg ring-1 ring-white/20", p.flip && "-scale-x-100")} sizes="62px" />
          <figcaption className="mt-1.5 text-center text-[11px] text-subtle">{p.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function ScenesVisual() {
  return (
    <div className="grid size-full grid-cols-3 gap-2 p-3">
      {features.scenes.map((b) => (
        <span
          key={b.id}
          className="flex items-end rounded-md bg-cover bg-center p-1.5 ring-1 ring-white/15"
          style={{ backgroundImage: `url(${b.image})` }}
        >
          <span className="truncate rounded bg-black/45 px-1 text-[9px] text-white">{b.label}</span>
        </span>
      ))}
    </div>
  );
}

function ClosetVisual() {
  return (
    <div className="grid size-full grid-cols-3 gap-2 p-3">
      {features.closet.map((src) => (
        <GarmentTile key={src} src={src} className="h-[76px]" />
      ))}
    </div>
  );
}

function ComboVisual() {
  return (
    <div className="flex size-full flex-col items-center px-2 pt-6">
      <div className="flex items-center gap-1">
        {features.combo.map((src, i) => (
          <span key={src} className="flex items-center gap-1">
            {i > 0 && <Plus className="size-3.5 text-muted" />}
            <GarmentTile src={src} className="size-[56px]" />
          </span>
        ))}
      </div>
      <span className="mt-4 flex h-8 items-center gap-1.5 rounded-full border border-[#7c5cff]/70 bg-[#6645eb]/20 px-3 text-xs text-white">
        <Sparkles className="size-3.5 text-[#a99bff]" />
        Weekend look, ready
      </span>
    </div>
  );
}

function ValueVisual() {
  return (
    <div className="flex size-full flex-col gap-3.5 px-4 pt-6">
      {features.value.map((row) => (
        <div key={row.label} className="grid grid-cols-[60px_1fr_40px] items-center gap-2 text-[11px]">
          <span className="text-subtle">{row.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-white/8">
            <span className="block h-full rounded-full bg-[linear-gradient(90deg,#6645eb,#a99bff)]" style={{ width: `${row.pct}%` }} />
          </span>
          <span className="text-right text-white">{row.perWear}</span>
        </div>
      ))}
    </div>
  );
}

const CHIP_TONES = ["bg-[#3fc28f] text-white", "bg-[#a51ff0] text-white", "bg-[#6645eb] text-white"];
const CURSOR_TONES = ["#3fc28f", "#a51ff0", "#7c5cff"];
const CHIP_POSITIONS = ["left-[6px] top-[78px]", "left-[14px] top-[114px]", "right-[8px] top-[92px]"];
const CURSOR_POSITIONS = ["left-[52px] top-[66px]", "left-[64px] top-[102px] -scale-x-100", "right-[52px] top-[78px] -scale-x-100"];

function CircleVisual() {
  return (
    <div className="relative size-full">
      <div className="absolute left-1/2 top-[18px] flex -translate-x-1/2 -space-x-2.5">
        {features.circle.map((p) => (
          <Art key={p.name} image={p.image} className="size-[46px] rounded-full ring-2 ring-[#6645eb]/70" sizes="46px" />
        ))}
      </div>
      {features.circle.map((p, i) => (
        <span key={p.name}>
          <svg viewBox="0 0 16 16" className={cn("absolute size-4", CURSOR_POSITIONS[i])} aria-hidden>
            <path d="M15 1 1 6.5l6 2 2 6L15 1Z" fill={CURSOR_TONES[i]} />
          </svg>
          <span className={cn("absolute rounded-full px-2.5 py-0.5 text-xs", CHIP_TONES[i], CHIP_POSITIONS[i])}>{p.name}</span>
        </span>
      ))}
    </div>
  );
}

function EventVisual() {
  const { day, month, title, locked } = features.event;
  return (
    <div className="relative size-full p-3">
      <div className="relative flex h-full flex-col items-center overflow-hidden rounded-md border border-white/10 bg-[linear-gradient(180deg,#141233,#0b0a22)] pt-4">
        <div className="absolute left-1/2 top-[34px] h-[160px] w-[180px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(160,140,255,0.3),rgba(160,140,255,0))] [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
        <span className="relative text-[11px] tracking-[0.2em] text-[#b3a6ff]">{month}</span>
        <span className="relative text-[40px] font-medium leading-none text-white">{day}</span>
        <span className="relative mt-2 text-xs text-white">{title}</span>
        <span className="relative mt-1 text-[10px] text-muted">{locked}</span>
      </div>
    </div>
  );
}

function VoteVisual() {
  const { image, up, down } = features.vote;
  return (
    <div className="flex size-full items-center justify-center gap-4 p-3">
      <Art image={image} className="h-[150px] w-[100px] rounded-lg ring-1 ring-white/20" sizes="100px" />
      <div className="flex flex-col gap-2.5">
        <span className="flex h-9 items-center gap-2 rounded-full bg-[#3fc28f] px-3.5 text-sm font-medium text-white">
          <ThumbsUp className="size-4" /> {up}
        </span>
        <span className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-3.5 text-sm text-subtle">
          <ThumbsDown className="size-4" /> {down}
        </span>
      </div>
    </div>
  );
}
