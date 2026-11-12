import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className="chrome text-[2.25rem] font-medium leading-tight tracking-[-0.03em]">{title}</h1>
        {description && <p className="mt-1 text-body text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
