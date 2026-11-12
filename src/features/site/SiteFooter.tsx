import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";
import { brand } from "@/data/landing-page";
import { siteFooter } from "@/data/site-content";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-white/8">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <LogoMark className="size-7" />
          <span className="text-sm text-muted">{brand.copyright}</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {siteFooter.links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-subtle transition-colors hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
