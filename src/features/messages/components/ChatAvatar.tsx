import { assetUrl } from "@/lib/api/config";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

/** A person's photo or initial, or the group mark; `online` adds the presence dot (true/false), omitted for none. */
export function ChatAvatar({
  name,
  avatar,
  group = false,
  online,
  className,
}: {
  name: string;
  avatar?: string | null;
  group?: boolean;
  online?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex size-11 shrink-0", className)}>
      {group ? (
        <span className="flex size-full items-center justify-center rounded-full border border-[#6b55d8]/40 bg-[radial-gradient(circle_at_50%_30%,#2a2168,#0c0a26)]">
          <Users className="size-[45%] text-white" strokeWidth={1.75} />
        </span>
      ) : avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assetUrl(avatar)} alt="" className="size-full rounded-full object-cover ring-1 ring-white/10" />
      ) : (
        <span className="flex size-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_30%,#3b2a8f,#16103f)] text-[0.8em] font-medium text-white ring-1 ring-white/10">
          {(name || "U").charAt(0).toUpperCase()}
        </span>
      )}
      {online !== undefined && (
        <span
          aria-label={online ? "Online" : undefined}
          className={cn("absolute bottom-0 right-0 size-[28%] min-h-2.5 min-w-2.5 rounded-full ring-2 ring-canvas", online ? "bg-green" : "hidden")}
        />
      )}
    </span>
  );
}
