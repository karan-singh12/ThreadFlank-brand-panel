import type { CSSProperties } from "react";
import { LogoMark } from "@/components/ui/LogoMark";
import { Icon } from "@/lib/icons";
import { forBrands } from "@/data/landing-page";

// 840×840 design box; ring radii and starting angles measured from the reference.
const SIZE = 840;
const OUTER_R = 365;
const INNER_R = 175;
const OUTER_ANGLES = [-58, 68, 179];
const INNER_ANGLES = [-90, 39, 143];

type App = { icon: string; size: number };

function Ring({
  apps,
  angles,
  radius,
  duration,
  reverse,
}: {
  apps: App[];
  angles: number[];
  radius: number;
  duration: number;
  reverse?: boolean;
}) {
  const spin = `${reverse ? "spin-slow-reverse" : "spin-slow"} ${duration}s linear infinite`;
  const counter = `${reverse ? "spin-slow" : "spin-slow-reverse"} ${duration}s linear infinite`;
  return (
    <div className="absolute inset-0" style={{ animation: spin }}>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6b6fd0]/45"
        style={{ width: radius * 2, height: radius * 2 }}
      />
      {apps.map((app, i) => {
        const rad = (angles[i] * Math.PI) / 180;
        const style: CSSProperties = {
          width: app.size,
          height: app.size,
          left: Number((SIZE / 2 + radius * Math.cos(rad) - app.size / 2).toFixed(2)),
          top: Number((SIZE / 2 + radius * Math.sin(rad) - app.size / 2).toFixed(2)),
        };
        return (
          <div key={app.icon} className="absolute" style={style}>
            <div className="chip-gloss flex size-full items-center justify-center rounded-full" style={{ animation: counter }}>
              <span style={{ width: app.size * 0.42, height: app.size * 0.42 }}>
                <Icon name={app.icon} className="icon-silver size-full" strokeWidth={3} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Orbit() {
  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }} aria-hidden>
      <div className="absolute left-1/2 top-[40%] size-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff1f9e] opacity-45 blur-[110px]" />
      <div className="absolute left-1/2 top-1/2 size-[537px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,#46e8ff_0%,#4658ff_29%,rgba(3,0,10,0)_100%)] opacity-25" />
      <div className="absolute left-1/2 top-[64%] size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1fffec] opacity-40 blur-[110px]" />
      <div className="absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(70,31,168,0.4),transparent_70%)]" />

      <Ring apps={forBrands.outerApps} angles={OUTER_ANGLES} radius={OUTER_R} duration={48} />
      <Ring apps={forBrands.innerApps} angles={INNER_ANGLES} radius={INNER_R} duration={34} />

      <div className="absolute left-1/2 top-1/2 size-[120px] -translate-x-1/2 -translate-y-1/2">
        <LogoMark halo className="size-full drop-shadow-[0_0_40px_rgba(102,69,235,0.9)]" />
      </div>
    </div>
  );
}
