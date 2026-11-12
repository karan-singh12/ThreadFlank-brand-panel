import type { ReactNode } from "react";

export function AuthHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="chrome text-[2.25rem] font-medium leading-[1.15] tracking-[-0.03em] sm:text-[2.625rem]">{title}</h1>
      {description && <p className="mt-3 text-body text-muted">{description}</p>}
      {children}
    </header>
  );
}
