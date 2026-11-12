import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "btn-primary",
  light: "btn-light",
};

const sizes = {
  sm: "h-10 px-5 text-body font-medium",
  lg: "h-[52px] px-6 text-lg font-medium sm:h-[60px] sm:px-8 sm:text-body-lg",
};

export function Button({
  variant = "primary",
  size = "lg",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-(--radius-pill) transition-[transform,filter] duration-300 ease-(--ease-premium) hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
