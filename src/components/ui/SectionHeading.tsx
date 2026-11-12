import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/** Cyan eyebrow + 70px chrome title, centered — the reference's standard section header. */
export function SectionHeading({
  eyebrow,
  title,
  children,
  className,
  titleClassName,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <Reveal className={cn("flex flex-col items-center text-center", className)}>
      {eyebrow && <p className="text-body-lg text-cyan">{eyebrow}</p>}
      <h2 className={cn("chrome mt-3 text-h1 font-medium text-balance", titleClassName)}>{title}</h2>
      {children}
    </Reveal>
  );
}
