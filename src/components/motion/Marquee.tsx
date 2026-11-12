import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Infinite horizontal loop. Children are rendered twice and the track slides
 * by exactly one copy, so the loop is seamless regardless of item widths.
 */
export function Marquee({
  children,
  duration = 40,
  reverse = false,
  gap = 24,
  className,
  trackClassName,
}: {
  children: ReactNode;
  duration?: number;
  reverse?: boolean;
  gap?: number;
  className?: string;
  trackClassName?: string;
}) {
  const style = { "--marquee-duration": `${duration}s`, gap } as CSSProperties;
  return (
    <div className={cn("flex overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max shrink-0",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
          trackClassName
        )}
        style={style}
      >
        <div className="flex shrink-0 items-center" style={{ gap }}>
          {children}
        </div>
        <div className="flex shrink-0 items-center" style={{ gap }} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
