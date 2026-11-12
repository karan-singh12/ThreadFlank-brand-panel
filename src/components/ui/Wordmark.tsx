import { cn } from "@/lib/utils";

/** "ThreadFlank" as in the logo artwork: "Thread" in the surrounding text colour, "Flank" in violet. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      Thread<span className={cn("text-[#7c5cff]")}>Flank</span>
    </span>
  );
}
