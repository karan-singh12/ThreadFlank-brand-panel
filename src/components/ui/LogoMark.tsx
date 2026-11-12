import { cn } from "@/lib/utils";

/**
 * Threadflank mark: the emblem from the supplied artwork (public/logo.png), pre-cropped to
 * public/logo-emblem.webp. Rounded-square badge by default; `halo` switches to the round badge
 * with a soft glow for the circular slots on the landing page.
 * Copy in Admin-panel/src/components/ui/LogoMark.tsx — keep the two in sync.
 */
export function LogoMark({ className, halo = false }: { className?: string; halo?: boolean }) {
  return (
    <span className={cn("relative inline-block shrink-0", className)} aria-hidden>
      {halo && <span className="absolute inset-0 rounded-full bg-[#6645eb]/25" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-emblem.webp"
        alt=""
        draggable={false}
        className={cn(
          "absolute select-none object-cover ring-1 ring-white/15",
          halo ? "inset-[6%] rounded-full" : "inset-0 rounded-[28%]",
        )}
      />
    </span>
  );
}
