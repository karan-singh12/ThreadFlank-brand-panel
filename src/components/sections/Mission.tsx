"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Marquee } from "@/components/motion/Marquee";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/lib/icons";
import { mission } from "@/data/landing-page";

function Word({ word, index, total, progress }: { word: string; index: number; total: number; progress: MotionValue<number> }) {
  const start = index / total;
  const opacity = useTransform(progress, [start, start + 1 / total], [0.28, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block whitespace-pre">
      {word}{" "}
    </motion.span>
  );
}

export function Mission() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const lines = mission.statementLines.map((line) => line.split(" "));
  const total = lines.flat().length;
  const offsets = lines.map((_, li) => lines.slice(0, li).flat().length);

  return (
    <section id="about" className="pt-40 lg:pt-[270px]">
      <Container>
        <p ref={ref} className="mx-auto max-w-[1000px] text-center text-statement text-white">
          {lines.map((words, li) => (
            <span key={li}>
              {words.map((word, wi) => (
                <Word key={wi} word={word} index={offsets[li] + wi} total={total} progress={scrollYProgress} />
              ))}
              <span className="hidden lg:block" />
            </span>
          ))}
        </p>

        <div className="mt-24 flex flex-col gap-10 lg:mt-[168px] lg:flex-row lg:items-center lg:justify-between lg:pl-14 lg:pr-[108px]">
          <Reveal className="flex items-center gap-5">
            <span className="text-h1 font-medium text-accent">{mission.stat.value}</span>
            <span className="text-body-lg text-muted">
              {mission.stat.label[0]}
              <br />
              {mission.stat.label[1]}
            </span>
          </Reveal>

          <Reveal delay={0.1} className="w-full lg:w-[552px]">
            <Marquee duration={22} gap={24} className="[mask-image:linear-gradient(90deg,transparent,#000_25%)]">
              {mission.categories.map((icon) => (
                <span
                  key={icon}
                  className="flex size-[72px] items-center justify-center rounded-xl border border-white/10 bg-[linear-gradient(180deg,#0b0c24,#05061a)]"
                >
                  <Icon name={icon} className="icon-silver size-8" strokeWidth={2.4} />
                </span>
              ))}
            </Marquee>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
