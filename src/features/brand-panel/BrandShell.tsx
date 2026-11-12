"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, LogOut, Settings } from "lucide-react";
import { LogoMark } from "@/components/ui/LogoMark";
import { Wordmark } from "@/components/ui/Wordmark";
import { ErrorState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Controls";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { BrandAvatar } from "./BrandAvatar";
import { BrandSettings } from "./BrandSettings";
import { useBrandPanel } from "./BrandPanelProvider";
import { BRAND_NAV, isNavActive } from "./nav";

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/**
 * The brand panel's frame, identical to the shopper app's: floating header with a centred pill
 * nav, an avatar menu on the right, and a bottom tab bar on phones.
 */
export function BrandShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, error, reload, brand } = useBrandPanel();

  // The header floats over the page; once content scrolls under it, give it a backdrop.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div data-app className="relative min-h-dvh">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-280px] h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-accent/20 blur-[150px]" />
        <div className="absolute -left-[12%] top-[18%] h-[50%] w-[40%] rounded-full bg-[#6645eb]/10 blur-[140px]" />
        <div className="absolute -right-[10%] bottom-[-18%] h-[55%] w-[40%] rounded-full bg-[#1f8fff]/8 blur-[150px]" />
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 h-(--app-header) border-b border-white/8 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-colors",
          scrolled ? "bg-canvas/85" : "bg-canvas/75"
        )}
      >
        <div className="relative mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-bright">
            <LogoMark className="size-9" />
            <Wordmark className="text-title font-medium text-white" />
          </Link>

          <nav
            aria-label="Main"
            className="absolute left-1/2 top-1/2 hidden h-11 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-white/15 bg-[#0b0b1e]/85 px-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl md:flex"
          >
            {BRAND_NAV.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-full px-4 text-sm transition-colors",
                    active ? "chip-on font-medium" : "text-subtle hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <item.icon className="size-4" strokeWidth={1.75} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <ProfileMenu />
        </div>
      </header>

      <div className="relative pb-[calc(var(--app-tabbar)+1rem)] md:pb-0">
        <main className="mx-auto max-w-[1280px] px-4 pb-10 pt-6 sm:px-8 sm:pt-10">
          {status === "loading" ? (
            <PageSkeleton />
          ) : status === "error" || !brand ? (
            <ErrorState message={error || "We couldn't load your brand."} onRetry={reload} className="py-16" />
          ) : (
            <div key={pathname} className="animate-fade-in space-y-6">
              {brand.status === "PENDING" && (
                <Notice tone="info">
                  Your email is verified and your brand is under review. You can set everything up now; your brand, catalog and drops
                  become visible to shoppers once our team approves it.
                </Notice>
              )}
              {children}
            </div>
          )}
        </main>
      </div>

      <nav
        aria-label="Mobile Navigation"
        data-tabbar
        className="fixed inset-x-0 bottom-0 z-50 flex h-(--app-tabbar) items-start justify-around border-t border-white/8 bg-canvas/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden"
      >
        {BRAND_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex h-16 flex-1 flex-col items-center justify-center gap-1 text-center transition-colors", active ? "font-medium text-white" : "text-subtle hover:text-white")}
            >
              <span className={cn("flex size-8 items-center justify-center rounded-full transition-all", active ? "chip-on" : "text-muted")}>
                <item.icon className="size-[18px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              </span>
              <span className="text-[11px] leading-none tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Avatar button with the brand's account menu, like the shopper app's profile menu. */
function ProfileMenu() {
  const { brand } = useBrandPanel();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useDismiss(open, close);
  const name = brand?.name ?? user?.username ?? "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls="brand-menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-10 items-center justify-center rounded-full border border-white/15 bg-[#0b0b1e]/80 p-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:scale-105 hover:border-white/30",
          open && "border-accent-bright/60 ring-2 ring-accent-bright/30"
        )}
      >
        <BrandAvatar name={name || "?"} src={brand?.logo} className="size-[34px] ring-0" />
      </button>

      {open && (
        <div
          id="brand-menu"
          className="absolute right-0 top-[calc(100%+10px)] w-[264px] origin-top-right rounded-(--radius-panel) border border-white/10 bg-[#0b0b1e] p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 px-3 pb-3 pt-2">
            <BrandAvatar name={name || "?"} src={brand?.logo} className="size-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>

          <Link
            href="/ai-studio"
            onClick={close}
            className="mx-1 mb-1 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm transition-colors hover:border-white/25"
          >
            <span className="flex items-center gap-2 text-white">
              <Coins className="size-4 text-cyan" strokeWidth={1.75} />
              {brand ? `${brand.aiCredits} AI credits` : "AI credits"}
            </span>
            <span className="text-xs text-accent-bright">Use</span>
          </Link>

          <div className="mt-2 flex flex-col border-t border-white/8 pt-2">
            <button
              type="button"
              onClick={() => {
                close();
                setSettingsOpen(true);
              }}
              disabled={!brand}
              className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-subtle transition-colors hover:bg-white/6 hover:text-white disabled:opacity-60"
            >
              <Settings className="size-4" strokeWidth={1.75} />
              Store settings
            </button>
          </div>

          <div className="mt-2 border-t border-white/8 pt-2">
            <button
              type="button"
              onClick={() => {
                close();
                logout();
              }}
              className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-red-300 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      )}

      <BrandSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
