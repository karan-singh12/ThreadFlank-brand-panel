import { AlertTriangle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ActionButton } from "./Controls";

/** What's missing and the next step; used for empty lists and failed loads alike. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-(--radius-card) bg-white/[0.02] px-6 py-10 text-center ring-1 ring-white/[0.08]", className)}>
      <span className="keycap flex size-12 items-center justify-center rounded-2xl">
        <Icon className="size-5 text-[#c9bcff]" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-medium text-white">{title}</h3>
      {description && <p className="mt-1.5 max-w-[340px] text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Couldn't load this"
      description={message}
      action={onRetry && <ActionButton variant="ghost" onClick={onRetry}>Try again</ActionButton>}
      className={className}
    />
  );
}
