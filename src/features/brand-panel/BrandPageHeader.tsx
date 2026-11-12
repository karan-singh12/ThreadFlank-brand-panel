import type { ReactNode } from "react";

/** The shopper app's page hero (cyan eyebrow, chrome title, short blurb) with a slot for actions on the right. */
export function BrandPageHeader({ eyebrow, title, blurb, actions }: { eyebrow: string; title: string; blurb?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="relative">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[min(720px,100%)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(214,31,255,0.16),rgba(102,69,235,0.14)_45%,transparent_70%)] blur-2xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan">{eyebrow}</p>
          <h1 className="chrome mt-2 text-h2 font-medium">{title}</h1>
          {blurb && <p className="mt-2 max-w-[520px] text-sm text-muted sm:text-body">{blurb}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
