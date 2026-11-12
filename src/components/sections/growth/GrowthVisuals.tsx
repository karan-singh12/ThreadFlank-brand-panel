import { Check, Sparkles } from "lucide-react";
import { Art } from "@/components/ui/Art";
import { FilterPill } from "@/components/ui/FilterPill";
import { Icon } from "@/lib/icons";
import { howItWorks } from "@/data/landing-page";

// All three visuals are laid out in the reference's 656×592 card coordinates.

function Arc({ r, pct, color, track }: { r: number; pct: number; color: string; track: string }) {
  const c = 2 * Math.PI * r;
  return (
    <>
      <circle cx="130" cy="130" r={r} fill="none" stroke={track} strokeWidth="15" />
      <circle
        cx="130"
        cy="130"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="15"
        strokeLinecap="round"
        strokeDasharray={`${((c * pct) / 100).toFixed(2)} ${c.toFixed(2)}`}
        transform="rotate(-90 130 130)"
      />
    </>
  );
}

/** Step 1 — the selfie wrapped in "twin ready" rings, with the body details below. */
export function TwinVisual() {
  const { photo, tooltip, rows } = howItWorks.twin;
  return (
    <div className="absolute inset-x-[89px] bottom-0 top-[48px] rounded-t-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0.03))]">
      <div className="absolute left-[118px] top-[50px] size-[260px]">
        <svg viewBox="0 0 260 260" className="size-full" aria-hidden>
          <defs>
            <linearGradient id="twin-outer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6f4cff" />
              <stop offset="100%" stopColor="#8f6bff" />
            </linearGradient>
          </defs>
          <Arc r={108} pct={100} color="url(#twin-outer)" track="rgba(255,255,255,0.06)" />
          <Arc r={80} pct={100} color="#a99bff" track="rgba(255,255,255,0.06)" />
        </svg>
        <Art image={photo} className="absolute left-1/2 top-1/2 size-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/20" sizes="130px" />
      </div>
      <div className="absolute left-[282px] top-[190px] rounded-[10px] bg-black px-5 py-4 text-[15px] text-white">
        <p className="flex items-center gap-2.5">
          <span className="flex size-5 items-center justify-center rounded-[4px] bg-[#28e69d]">
            <Check className="size-3.5 text-black" strokeWidth={3} />
          </span>
          {tooltip.label}
        </p>
        <p className="mt-2.5 flex gap-4 text-subtle">
          <span>{tooltip.value}</span>
          <span>{tooltip.percent}</span>
        </p>
      </div>
      <div className="absolute inset-x-[42px] top-[340px] flex flex-col gap-[30px]">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_120px_80px] items-center text-body text-[#d0d0dc]">
            <span className="flex items-center gap-3">
              <span className="size-6 rounded-[5px]" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <span className="text-white">{row.value}</span>
            <span className="text-right text-green">{row.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Step 2 — one request fans out into three draped looks. */
export function LooksVisual() {
  const { promptLabel, prompt, outputs } = howItWorks.looks;
  const tops = [290, 330, 290];
  const lefts = [80, 253, 426];
  return (
    <div className="relative size-full">
      <div className="absolute left-[140px] top-[56px] w-[377px] rounded-xl bg-[#1d1c2f] p-[25px] pt-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{promptLabel}</span>
          <span className="flex size-7 items-center justify-center rounded-full bg-[#5a3ff0]">
            <Sparkles className="size-4 text-white" />
          </span>
        </div>
        <p className="mt-4 text-sm leading-[1.55] text-white">{prompt}</p>
      </div>

      <svg className="absolute inset-0 size-full" viewBox="0 0 656 592" aria-hidden>
        <path d="M329 214V254M155 290V254H501V290M329 254V330" stroke="#5b3fe0" strokeWidth="1.5" fill="none" opacity="0.9" />
        <circle cx="329" cy="214" r="5" fill="#fff" stroke="#6645eb" strokeWidth="3" />
      </svg>

      {outputs.map((o, i) => (
        <div key={o.label} className="absolute w-[150px] text-center" style={{ left: lefts[i], top: tops[i] }}>
          <Art image={o.image} tone={o.tone} className="h-[190px] w-[150px] rounded-[10px] ring-1 ring-white/30" sizes="150px" />
          <p className="mt-3 text-body text-white">{o.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Step 3 — occasion filters, a shortlist and the "ask / lock in" actions. */
export function DecideVisual() {
  const { filters, suggestedLabel, images, actions } = howItWorks.decide;
  return (
    <div className="absolute inset-x-[89px] bottom-0 top-[48px] overflow-hidden rounded-t-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0.03))] px-[46px] pt-5">
      {filters.map((f) => (
        <div key={f.label} className="flex h-[70px] items-center justify-between border-b border-white/10">
          <span className="flex items-center gap-2 text-body text-muted">
            <Icon name="chevrons" className="size-4 rotate-90" />
            {f.label}
          </span>
          <FilterPill className="h-8 px-3.5 text-sm">{f.value}</FilterPill>
        </div>
      ))}
      <div className="mt-[28px] rounded-2xl bg-white/5 p-6 pb-4">
        <p className="text-sm text-muted">{suggestedLabel}</p>
        <div className="mt-4 grid grid-cols-2 gap-5">
          {images.map((img, i) => (
            <Art key={i} image={img.image} tone={img.tone} className="h-[124px] rounded-[10px]" sizes="160px" />
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {actions.map((a, i) => (
            <span
              key={a.label}
              className={`flex h-10 items-center gap-2.5 rounded-lg px-4 text-sm ${i === 0 ? "bg-[#6645eb] text-white" : "bg-white/10 text-muted"}`}
            >
              <Icon name={a.icon} className="size-4" strokeWidth={1.5} />
              {a.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
