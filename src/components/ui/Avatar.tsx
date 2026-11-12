import { Art } from "./Art";
import { cn } from "@/lib/utils";

export function Avatar({
  tone,
  image,
  name,
  className,
  online,
}: {
  tone: string;
  image?: string;
  name: string;
  className?: string;
  online?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 aspect-square rounded-full overflow-hidden items-center justify-center", className)}>
      <Art image={image} tone={tone} alt={name} className="size-full aspect-square rounded-full overflow-hidden" sizes="64px" />
      {online !== undefined && (
        <span
          aria-label={online ? "Online" : "Offline"}
          className={cn(
            "absolute bottom-0 right-0 size-[28%] min-h-2.5 min-w-2.5 rounded-full ring-2 ring-canvas",
            online ? "bg-green" : "bg-dim"
          )}
        />
      )}
    </span>
  );
}
