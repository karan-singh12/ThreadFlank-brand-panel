import { cn } from "@/lib/utils";

/**
 * The hero logo: the emblem from the supplied ThreadFlank artwork (public/logo.png),
 * pre-cropped to public/logo-emblem.webp (the wordmark and tagline are left out) and shown
 * as a circle. The artwork's own dark background fills the circle.
 */
export function HeroEmblem({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-emblem.webp"
      alt=""
      aria-hidden
      draggable={false}
      className={cn("block shrink-0 select-none rounded-full object-cover", className)}
    />
  );
}
