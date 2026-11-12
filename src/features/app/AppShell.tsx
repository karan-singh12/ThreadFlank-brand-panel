"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  CalendarHeart,
  Coins,
  ChevronDown,
  Flame,
  Scissors,
  Compass,
  Gem,
  Layers,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Scroll,
  ShieldAlert,
  Shirt,
  Store,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { LogoMark } from "@/components/ui/LogoMark";
import { Wordmark } from "@/components/ui/Wordmark";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { appNav } from "@/data/app-content";
import { NotificationBell } from "./NotificationBell";
import { CallProvider } from "@/features/calls/CallProvider";
import { useWallet } from "@/features/billing/api";

const ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  store: Store,
  shirt: Shirt,
  layers: Layers,
  message: MessageCircle,
  user: User,
  users: Users,
  bookmark: Bookmark,
  gem: Gem,
  mail: Mail,
  scroll: Scroll,
  shield: ShieldAlert,
  calendar: CalendarHeart,
  flame: Flame,
  scissors: Scissors,
};

/** `also` lists extra path prefixes that should light up this item (e.g. /events/:id under Saved). */
type NavItem = { id: string; label: string; href: string; icon: string; also?: readonly string[] };

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status } = useAuth();
  const signedIn = status === "authenticated";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isNavActive = (item: NavItem) => isActive(item.href) || (item.also ?? []).some(isActive);

  // The signed-in header floats over the page; once content scrolls under it, give it a backdrop.
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
        {/* Still violet and blue glows, as on the landing page, so the dark canvas has depth. */}
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
          <Link href={signedIn ? "/discover" : "/"} className="flex shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-bright">
            <LogoMark className="size-9" />
            <Wordmark className="text-title font-medium text-white" />
          </Link>

          {signedIn && (
            <nav
              aria-label="Main"
              className="absolute left-1/2 top-1/2 hidden h-11 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-white/15 bg-[#0b0b1e]/85 px-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl md:flex"
            >
              {appNav.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isNavActive(item);
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
                    <Icon className="size-4" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {signedIn ? (
            <div className="flex items-center gap-2">
              <ProfileMenu isActive={isActive} />
            </div>
          ) : status === "unauthenticated" ? <GuestActions isActive={isActive} /> : <span className="size-9" />}
        </div>
      </header>

      {/* Each page fades in on navigation (opacity only, so fixed-position children aren't displaced). */}
      <div className={cn("relative", signedIn && "pb-[calc(var(--app-tabbar)+1rem)] md:pb-0")}>
        {signedIn ? (
          <CallProvider>
            <div key={pathname} className="animate-fade-in">
              {children}
            </div>
          </CallProvider>
        ) : (
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        )}
      </div>

      {signedIn && (
        <nav
          aria-label="Mobile Navigation"
          data-tabbar
          className="fixed inset-x-0 bottom-0 z-50 flex h-(--app-tabbar) items-start justify-around border-t border-white/8 bg-canvas/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden"
        >
          {appNav.items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isNavActive(item);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-1 flex-col items-center justify-center gap-1 text-center transition-colors",
                  active ? "font-medium text-white" : "text-subtle hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-all",
                    active ? "chip-on" : "text-muted"
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                </span>
                <span className="text-[11px] leading-none tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

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

function MenuLink({ item, active, onSelect }: { item: NavItem; active: boolean; onSelect: () => void }) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
        active ? "bg-violet-300/15 text-violet-100" : "text-subtle hover:bg-white/6 hover:text-white"
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

function MenuPanel({ children, id }: { children: ReactNode; id: string }) {
  return (
    <div
      id={id}
      className="absolute right-0 top-[calc(100%+10px)] w-[264px] origin-top-right rounded-(--radius-panel) border border-white/10 bg-[#0b0b1e] p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
    >
      {children}
    </div>
  );
}

function ProfileMenu({ isActive }: { isActive: (href: string) => boolean }) {
  const { user, logout } = useAuth();
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useDismiss(open, close);
  const name = user?.username || user?.email.split("@")[0] || "";
  // Query-string entries (e.g. ?tab=looks) share /profile, so only the plain Profile link shows as active.
  const activeFor = (href: string) => !href.includes("?") && isActive(href);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={appNav.menuLabel}
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-10 items-center justify-center rounded-full border border-white/15 bg-[#0b0b1e]/80 p-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:border-white/30 hover:scale-105",
          open && "border-accent-bright/60 ring-2 ring-accent-bright/30"
        )}
      >
        <span className="flex size-[34px] items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-medium text-white">
          {user?.avatar ? <Photo src={user.avatar} alt="" /> : name.charAt(0).toUpperCase()}
        </span>
      </button>

      {open && (
        <MenuPanel id="profile-menu">
          <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-medium text-white">
                {user?.avatar ? <Photo src={user.avatar} alt="" /> : name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
            </div>
            <NotificationBell inMenu />
          </div>

          {/* Image credits, with a way to top up. */}
          <Link
            href="/pricing"
            onClick={close}
            className="mx-1 mb-1 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm transition-colors hover:border-white/25"
          >
            <span className="flex items-center gap-2 text-white">
              <Coins className="size-4 text-cyan" strokeWidth={1.75} />
              {wallet ? `${wallet.balance} credit${wallet.balance === 1 ? "" : "s"}` : "Credits"}
            </span>
            <span className="text-xs text-accent-bright">Get more</span>
          </Link>

          <nav aria-label="Account" className="mt-2 flex flex-col border-t border-white/8 pt-2">
            {appNav.account.map((item) => (
              <MenuLink key={item.id} item={item} active={activeFor(item.href)} onSelect={close} />
            ))}
            {user?.role === "ADMIN" && (
              <MenuLink
                item={{ id: "admin-portal", label: "Admin Portal", href: "/admin", icon: "shield" }}
                active={isActive("/admin")}
                onSelect={close}
              />
            )}
          </nav>

          <nav aria-label={appNav.moreLabel} className="mt-2 flex flex-col border-t border-white/8 pt-2">
            {appNav.more.map((item) => (
              <MenuLink key={item.id} item={item} active={isActive(item.href)} onSelect={close} />
            ))}
          </nav>

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
              {appNav.logout}
            </button>
          </div>
        </MenuPanel>
      )}
    </div>
  );
}

function GuestActions({ isActive }: { isActive: (href: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useDismiss(open, close);

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <nav aria-label={appNav.moreLabel} className="mr-2 hidden items-center gap-1 lg:flex">
        {appNav.more.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn("rounded-full px-3 py-1.5 text-sm transition-colors", isActive(item.href) ? "text-white" : "text-subtle hover:text-white")}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm text-subtle transition-colors hover:text-white sm:block">
        {appNav.login}
      </Link>
      <Link href="/signup" className="btn-primary inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-[filter] hover:brightness-110">
        {appNav.signup}
      </Link>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="guest-menu"
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 items-center justify-center rounded-full border border-white/12 text-white lg:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <MenuPanel id="guest-menu">
          <nav aria-label={appNav.moreLabel} className="flex flex-col">
            {appNav.more.map((item) => (
              <MenuLink key={item.id} item={item} active={isActive(item.href)} onSelect={close} />
            ))}
            <Link href="/login" onClick={close} className="mt-2 flex h-10 items-center rounded-xl border-t border-white/8 px-3 text-sm text-subtle hover:text-white">
              {appNav.login}
            </Link>
          </nav>
        </MenuPanel>
      )}
    </div>
  );
}
