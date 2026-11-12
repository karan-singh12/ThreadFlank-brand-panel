import { ArrowDownRight, Search, Shirt, Zap } from "lucide-react";
import { LogoMark } from "@/components/ui/LogoMark";
import { Marquee } from "@/components/motion/Marquee";
import { Icon } from "@/lib/icons";
import { empower, features } from "@/data/landing-page";

const { speed, vote, stores, occasions, scenes, value, discover } = empower.cards;

// Chips around the speed arc: [angle°, size] measured on the reference.
const SPEED_CHIPS: [number, number][] = [
  [-156, 36],
  [-127, 44],
  [-90, 54],
  [-53, 44],
  [-24, 36],
];

/** 640×320 */
export function SpeedVisual() {
  const cx = 320;
  const cy = 244;
  const r = 178;
  return (
    <div className="relative h-[320px] w-[640px]">
      <div className="absolute left-1/2 top-[69px] h-[175px] w-[350px] -translate-x-1/2 overflow-hidden">
        <div className="size-[350px] rounded-full bg-[linear-gradient(180deg,rgba(181,190,247,0.12),rgba(135,140,255,0))]" />
      </div>
      <svg className="absolute inset-0" viewBox="0 0 640 320" aria-hidden>
        <path d={`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="5 6" />
        <path d={`M${cx - 150} ${cy}H${cx + 150}`} stroke="rgba(255,255,255,0.22)" strokeDasharray="5 6" />
      </svg>
      {SPEED_CHIPS.map(([angle, size], i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <span
            key={angle}
            className="chip-gloss absolute flex items-center justify-center rounded-full"
            style={{
              width: size,
              height: size,
              left: Number((cx + r * Math.cos(rad) - size / 2).toFixed(2)),
              top: Number((cy + r * Math.sin(rad) - size / 2).toFixed(2)),
            }}
          >
            <span style={{ width: size * 0.5, height: size * 0.5 }}>
              <Icon name={speed.apps[i]} className="icon-silver size-full" strokeWidth={3} />
            </span>
          </span>
        );
      })}
      <div className="absolute left-1/2 top-[244px] flex size-[110px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_30%,#2b1f78,#140f3c)] shadow-[inset_0_0_0_4px_#5b3fe0,0_0_40px_rgba(102,69,235,0.5)]">
        <Zap className="size-[52px] fill-white text-white" strokeWidth={1} />
      </div>
    </div>
  );
}

/** 640×320 */
export function VoteVisual() {
  return (
    <div className="relative h-[320px] w-[640px]">
      <div className="absolute left-1/2 top-[76px] flex -translate-x-1/2 gap-[29px]">
        {vote.keys.map((k) => (
          <span key={k} className="keycap flex size-[110px] items-center justify-center rounded-2xl text-[#e3ddff]">
            <Icon name={k} className="size-[48px]" strokeWidth={1.75} />
          </span>
        ))}
      </div>
      <span className="glass-pill absolute left-1/2 top-[220px] flex h-10 -translate-x-1/2 items-center rounded-[44px] px-4 text-body text-white">
        {vote.badge}
      </span>
    </div>
  );
}

/** 459×234 */
export function StoresVisual() {
  return (
    <div className="flex h-[234px] w-[459px] items-center">
      <Marquee duration={20} gap={24} className="fade-x w-full">
        {stores.map((icon) => (
          <span key={icon} className="keycap flex size-[75px] items-center justify-center rounded-[10px]">
            <Icon name={icon} className="icon-silver size-8" strokeWidth={3} />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

/** 459×234 */
export function OccasionsVisual() {
  return (
    <div className="flex h-[234px] w-[459px] items-center">
      <Marquee duration={20} gap={24} reverse className="fade-x w-full">
        {occasions.map((icon) => (
          <span
            key={icon}
            className="flex size-[72px] items-center justify-center rounded-full border-2 border-[#6b55d8]/35 bg-[radial-gradient(circle_at_50%_30%,#2a2168,#0c0a26)]"
          >
            <Icon name={icon} className="size-7 text-white" strokeWidth={2} />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

/** 821×320 */
export function ScenesVisual() {
  const [nodes, zap, spark, dots] = scenes.icons;
  return (
    <div className="relative flex h-[320px] w-[821px] items-center justify-center">
      <div aria-hidden className="absolute inset-x-0 top-0 grid h-full grid-cols-6 gap-2 px-6 py-5 opacity-45 [mask-image:linear-gradient(180deg,#000_30%,transparent_95%)]">
        {features.scenes.map((b) => (
          <span key={b.id} className="rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${b.image})` }} />
        ))}
      </div>
      <div className="absolute left-1/2 top-[160px] size-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(40,30,110,0.9)_40%,rgba(40,30,110,0.2)_70%,transparent_71%)]" />
      <div className="relative flex items-center gap-[36px]">
        <span className="keycap flex size-12 items-center justify-center rounded-lg">
          <Icon name={nodes} className="icon-silver size-5" strokeWidth={2.5} />
        </span>
        <span className="keycap flex size-[72px] items-center justify-center rounded-xl">
          <Icon name={zap} className="icon-silver size-8" strokeWidth={2.5} />
        </span>
        <span className="mx-4 flex size-[108px] items-center justify-center rounded-full bg-[#1a1450] shadow-[0_0_0_16px_rgba(30,24,80,0.8)]">
          <LogoMark className="size-[108px]" />
        </span>
        <span className="keycap flex size-[72px] items-center justify-center rounded-xl">
          <Icon name={spark} className="icon-silver size-8" strokeWidth={2.5} />
        </span>
        <span className="keycap flex size-12 items-center justify-center rounded-lg">
          <Icon name={dots} className="icon-silver size-5" strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}

/** 640×320 */
export function ValueVisual() {
  return (
    <div className="relative h-[320px] w-[640px]">
      <div className="absolute left-[140px] top-[65px] h-[210px] w-[360px] rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0))] px-[34px] pt-[26px]">
        <svg viewBox="0 0 292 70" className="h-[70px] w-[292px]" aria-hidden>
          <defs>
            <linearGradient id="value-line" x1="0" x2="1">
              <stop offset="0%" stopColor="#6645eb" />
              <stop offset="100%" stopColor="#b8aaff" />
            </linearGradient>
          </defs>
          <path
            d="M0 55C20 56 30 60 45 50S70 38 80 48 100 60 115 52 125 10 140 8 160 60 175 40 190 28 205 38 222 30 245 22 260 46 292 52"
            fill="none"
            stroke="url(#value-line)"
            strokeWidth="2.5"
          />
          <line x1="207" y1="0" x2="207" y2="70" stroke="rgba(255,255,255,0.25)" strokeDasharray="3 4" />
          <circle cx="207" cy="36" r="5.5" fill="#fff" stroke="#6645eb" strokeWidth="3" />
        </svg>
        <div className="mt-[18px] flex items-end justify-between">
          <p className="flex items-end gap-1.5">
            <span className="text-[40px] font-medium leading-none tracking-[0.02em] text-white">{value.value}</span>
            <span className="flex flex-col pb-0.5 text-[11px] leading-tight text-muted">
              <Shirt className="size-4 text-[#8f7bff]" strokeWidth={1.75} />
              {value.unit}
            </span>
          </p>
          <span className="mb-1 flex h-7 items-center gap-1 rounded-[3px] bg-[#6645eb] px-2 text-sm text-white">
            <ArrowDownRight className="size-4" />
            {value.change}
          </span>
        </div>
      </div>
    </div>
  );
}

/** 640×320 */
export function DiscoverVisual() {
  return (
    <div className="relative h-[320px] w-[640px]">
      <div className="absolute left-[166px] top-[69px] h-[40px] w-[308px] rounded-t-[16px] bg-white/4" />
      <div className="absolute left-[128px] top-[89px] h-[40px] w-[384px] rounded-t-[16px] bg-white/6" />
      <div className="absolute left-[109px] top-[109px] h-[170px] w-[422px] rounded-t-[16px] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0))] px-8 pt-8">
        <div className="flex h-12 items-center gap-2.5 rounded-full bg-white/10 px-4 text-body text-white">
          <Search className="size-5 shrink-0 text-muted" strokeWidth={1.5} />
          <span className="truncate">{discover.query}</span>
        </div>
        <div className="mt-5 flex justify-center gap-2.5">
          {discover.tags.map((t) => (
            <span key={t} className="flex h-[30px] items-center rounded-full border border-[#7c5cff]/80 bg-[#6645eb]/12 px-3 text-[13px] text-white">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
