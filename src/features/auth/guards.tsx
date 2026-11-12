"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { safeRedirect } from "./redirect";

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading">
      <LoaderCircle className="size-7 animate-spin text-accent-bright" aria-hidden />
    </div>
  );
}

/**
 * Renders children only for signed-in users. A guest who lands here is sent to
 * /login?next=… so they come back afterwards; a user who signs out while here
 * (logout, expired token, another tab) goes to a plain /login.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (status === "authenticated") wasAuthenticated.current = true;
    if (status !== "unauthenticated") return;
    router.replace(wasAuthenticated.current ? "/login" : `/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  return status === "authenticated" ? <>{children}</> : <FullScreenLoader />;
}

/**
 * Keeps signed-in users off login/signup by sending them where they were
 * headed. This is also the single place that navigates after a successful
 * login or signup. Children render while the session is still loading so the
 * form is server-rendered and interactive immediately for guests.
 */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");

  useEffect(() => {
    if (status === "authenticated") router.replace(safeRedirect(next));
  }, [status, router, next]);

  return status === "authenticated" ? <FullScreenLoader /> : <>{children}</>;
}
