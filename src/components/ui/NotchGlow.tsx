import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Funnel "tooth" hanging below the boundary line, drawn in a 232×116 box.
const TOOTH_PATH = "M0 0C24 0 36 6 46 22L94 100C104 116 128 116 138 100L186 22C196 6 208 0 232 0Z";
const TOOTH_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 232 116' preserveAspectRatio='none'><path d='${TOOTH_PATH}' fill='black'/></svg>`
)}")`;

/**
 * Clips its children to "everything above a horizontal boundary, plus a
 * rounded funnel dropping through the middle". The boundary height and funnel
 * width come from the --notch-top / --tooth-w CSS variables so callers can set
 * them per breakpoint with Tailwind arbitrary properties.
 */
export function NotchGlow({
  children,
  className,
  edge = true,
  toothFill,
}: {
  children: ReactNode;
  className?: string;
  edge?: boolean;
  /** When set, the funnel is painted with this background instead of revealing the glow. */
  toothFill?: string;
}) {
  const layers = toothFill ? "linear-gradient(#000, #000)" : `linear-gradient(#000, #000), ${TOOTH_MASK}`;
  const sizes = toothFill ? "100% var(--notch-top)" : "100% var(--notch-top), var(--tooth-w) calc(var(--tooth-w) / 2)";
  const positions = toothFill ? "0 0" : "0 0, 50% calc(var(--notch-top) - 1px)";
  const maskStyle: CSSProperties = {
    height: "calc(var(--notch-top) + var(--tooth-w) / 2)",
    maskImage: layers,
    maskSize: sizes,
    maskPosition: positions,
    maskRepeat: "no-repeat",
    WebkitMaskImage: layers,
    WebkitMaskSize: sizes,
    WebkitMaskPosition: positions,
    WebkitMaskRepeat: "no-repeat",
  };

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0", className)}>
      <div className="relative w-full overflow-hidden" style={maskStyle}>
        {children}
      </div>
      {toothFill && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: "calc(var(--notch-top) - 1px)",
            width: "var(--tooth-w)",
            height: "calc(var(--tooth-w) / 2)",
            background: toothFill,
            maskImage: TOOTH_MASK,
            WebkitMaskImage: TOOTH_MASK,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
          }}
        />
      )}
      {edge && (
        <>
          <div className="absolute left-0 h-px bg-white/10" style={{ top: "var(--notch-top)", width: "calc(50% - var(--tooth-w) / 2)" }} />
          <div className="absolute right-0 h-px bg-white/10" style={{ top: "var(--notch-top)", width: "calc(50% - var(--tooth-w) / 2)" }} />
          <svg
            viewBox="0 0 232 116"
            preserveAspectRatio="none"
            className="absolute left-1/2 -translate-x-1/2 overflow-visible"
            style={{ top: "var(--notch-top)", width: "var(--tooth-w)", height: "calc(var(--tooth-w) / 2)" }}
          >
            <path d={TOOTH_PATH.replace(/Z$/, "")} fill="none" stroke="rgba(255,255,255,0.1)" vectorEffect="non-scaling-stroke" />
          </svg>
        </>
      )}
    </div>
  );
}
