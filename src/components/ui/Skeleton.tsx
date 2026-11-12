import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("shimmer rounded-(--radius-card)", className)} {...props} />;
}

export function PageSkeleton() {
  return (
    <div aria-busy aria-label="Loading" role="status" className="space-y-6">
      <Skeleton className="h-28 rounded-(--radius-panel)" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-(--radius-panel)" />
    </div>
  );
}
