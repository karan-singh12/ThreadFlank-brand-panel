"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioLines } from "lucide-react";
import { EASE } from "@/components/motion/Reveal";

export function HeroTicker({ items, interval = 2200 }: { items: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  return (
    <div className="glass-pill flex h-10 w-[200px] items-center justify-center gap-2 overflow-hidden rounded-[44px] text-body text-white">
      <AudioLines className="size-4 shrink-0" strokeWidth={1.75} />
      <div className="relative h-[26px] w-[140px] overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.span
            key={index}
            initial={{ y: 26, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -26, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-0 whitespace-nowrap text-left leading-[26px]"
          >
            {items[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
