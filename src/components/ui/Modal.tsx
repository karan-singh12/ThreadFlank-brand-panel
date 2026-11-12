"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};
/** True in the browser, false during server render and hydration. */
const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (!open || !isClient) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, isClient, onClose]);

  if (!open || !isClient) return null;

  // Portalled to <body> so a modal opened inside a blurred or transformed container still covers the screen.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" tabIndex={-1} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative max-h-[92dvh] w-full overflow-y-auto rounded-t-(--radius-frame) border border-white/10 bg-[#0b0b1e] p-6 shadow-2xl outline-none sm:max-w-[520px] sm:rounded-(--radius-frame)",
          className
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-title font-medium text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/8 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
