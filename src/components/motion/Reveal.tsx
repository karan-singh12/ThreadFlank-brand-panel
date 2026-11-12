"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  scale?: number;
};

export function Reveal({ delay = 0, y = 32, scale = 1, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -4% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
