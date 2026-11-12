import { Photo } from "@/components/ui/Photo";
import { cn } from "@/lib/utils";

/** Brand logo in a circle; falls back to the brand's initial when there is no logo or it fails to load. */
export function BrandAvatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-medium text-white ring-1 ring-white/15", className)}>
      {src ? <Photo src={src} alt={name} /> : name.charAt(0).toUpperCase()}
    </span>
  );
}
