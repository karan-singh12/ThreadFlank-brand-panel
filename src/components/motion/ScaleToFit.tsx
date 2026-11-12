"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders children at a fixed design size and uniformly scales them down to
 * the available width — used for detailed product mockups that should shrink
 * like an image rather than reflow.
 */
export function ScaleToFit({
  width,
  height,
  children,
  className,
}: {
  width: number;
  height: number;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={ref} className={cn("min-w-0 overflow-hidden", className)} style={{ height: height * scale }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
