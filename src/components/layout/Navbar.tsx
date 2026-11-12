"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";
import { Wordmark } from "@/components/ui/Wordmark";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { brand, nav } from "@/data/landing-page";
import { useAuth } from "@/features/auth/AuthProvider";
import { assetUrl } from "@/lib/api/config";
import type { AuthUser } from "@/features/auth/types";

/** True once the page has scrolled past the top, so the bar can pick up a backdrop. */
function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return scrolled;
}

/**
 * In-page links scroll in code: closing the mobile menu in the same click
 * otherwise cancels the browser's smooth scroll before it starts.
 */
function scrollToHash(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith("#")) return;
  const target = document.getElementById(href.slice(1));
  if (!target) return;
  e.preventDefault();
  history.pushState(null, "", href);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
}

/** Simple circular profile avatar with zero dropdown error and graceful image error fallback */
function ProfileCircle({ user, size = "md" }: { user: AuthUser | null; size?: "sm" | "md" }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const name = user?.username || user?.email?.split("@")[0] || "User";
  const initial = name.charAt(0).toUpperCase();

  return (
    <Link
      href="/profile"
      aria-label="Profile"
      title={`${name}'s Profile`}
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-[#6645eb] to-[#3a26a3] font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:border-white/40",
        size === "sm" ? "size-9 text-xs" : "size-10 text-sm"
      )}
    >
      {user?.avatar && !avatarFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetUrl(user.avatar)}
          alt={name}
          onError={() => setAvatarFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        initial
      )}
    </Link>
  );
}

export function Navbar() {
  const { user, status } = useAuth();
  const signedIn = status === "authenticated";
  const scrolled = useScrolled();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Backdrop fades in on scroll so section content never collides with the bar. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 hidden h-[76px] border-b border-white/8 bg-canvas/70 backdrop-blur-xl transition-opacity duration-300 lg:block",
          scrolled ? "opacity-100" : "opacity-0"
        )}
      />

      <div className="relative mx-auto hidden h-[76px] max-w-(--container-page) items-center justify-between px-16 lg:flex">
        <a href="#top" className="flex items-center gap-3">
          <LogoMark className="size-10" />
          <Wordmark className="text-title font-medium text-ink" />
        </a>

        <nav aria-label="Main" className="absolute left-1/2 top-3 flex h-[52px] -translate-x-1/2 items-center rounded-full border border-white/15 bg-canvas/40 px-2 backdrop-blur-md">
          {nav.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => scrollToHash(e, link.href)}
              className="whitespace-nowrap rounded-full px-4 py-1.5 text-body text-ink-soft transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!signedIn ? (
            <Button href="/login" size="sm" className="h-10 px-5 text-sm font-medium">
              Log in
            </Button>
          ) : (
            <ProfileCircle user={user} size="md" />
          )}
        </div>
      </div>

      <div className="px-4 pt-3 sm:px-8 lg:hidden">
        <div className={cn("rounded-[28px] border border-white/12 backdrop-blur-md transition-colors duration-300", scrolled ? "bg-canvas/85" : "bg-canvas/60")}>
          <div className="flex h-[52px] items-center justify-between px-3">
            <a href="#top" aria-label={brand.name} className="flex items-center gap-2.5">
              <LogoMark className="size-9" />
              <Wordmark className="text-body-lg font-medium text-ink" />
            </a>
            <div className="flex items-center">
              {!signedIn ? (
                <Button href="/login" size="sm" className="h-9 px-4 text-xs font-medium">
                  Log in
                </Button>
              ) : (
                <ProfileCircle user={user} size="sm" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
