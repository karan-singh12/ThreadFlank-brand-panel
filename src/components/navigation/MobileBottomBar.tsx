"use client";

import React from "react";
import {
  LayoutDashboard,
  Layers,
  Video,
  Rocket,
  Award,
} from "lucide-react";
import type { NavTabId } from "@/types";
import { cn } from "@/lib/utils";

interface MobileBottomBarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
}

const MOBILE_NAV_TABS: { id: NavTabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "catalog", label: "Catalog", icon: Layers },
  { id: "ai-studio", label: "AI Studio", icon: Video },
  { id: "drops", label: "Drops", icon: Rocket },
  { id: "bidding", label: "Bidding", icon: Award },
];

export function MobileBottomBar({ activeTab, onTabChange }: MobileBottomBarProps) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/8 bg-[#040514]/92 px-2 backdrop-blur-2xl md:hidden"
    >
      {MOBILE_NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1 px-3 text-[10px] font-medium transition-colors cursor-pointer",
              active ? "text-white" : "text-muted hover:text-white"
            )}
          >
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-all",
                active ? "chip-on text-[#0b0b1e]" : "text-subtle"
              )}
            >
              <Icon className="size-4" strokeWidth={active ? 2.25 : 1.75} />
            </div>
            <span className={active ? "font-semibold" : ""}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
