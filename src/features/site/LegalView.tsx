"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LEGAL_UPDATED, type LegalSection } from "@/data/site-content";
import { fetchCmsBlock, parseLegalBody } from "./cms-api";

export function LegalView({
  title: initialTitle,
  intro: initialIntro,
  sections: initialSections,
  cmsKey,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  cmsKey?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [intro, setIntro] = useState(initialIntro);
  const [sections, setSections] = useState(initialSections);
  const [lastUpdated, setLastUpdated] = useState(LEGAL_UPDATED);
  const [isDynamic, setIsDynamic] = useState(false);

  useEffect(() => {
    if (!cmsKey) return;
    let live = true;
    fetchCmsBlock(cmsKey).then((block) => {
      if (!live || !block) return;
      const parsed = parseLegalBody(block);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.intro) setIntro(parsed.intro);
      if (parsed.sections && parsed.sections.length > 0) setSections(parsed.sections);
      if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      setIsDynamic(true);
    });
    return () => {
      live = false;
    };
  }, [cmsKey]);

  return (
    <main className="mx-auto max-w-[760px] px-4 py-12 sm:px-8 lg:py-16">
      <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-[0.1em] text-muted">Last updated {lastUpdated}</p>
        {isDynamic && (
          <span className="rounded-full bg-accent-bright/10 px-2 py-0.5 text-[10px] font-medium text-accent-bright border border-accent-bright/20">
            Live
          </span>
        )}
      </div>
      <h1 className="chrome mt-2 text-h2 font-medium">{title}</h1>
      <p className="mt-4 text-body-lg text-subtle">{intro}</p>

      <div className="mt-10 flex flex-col gap-8">
        {sections.map((s, idx) => (
          <section key={`${s.heading}-${idx}`}>
            <h2 className="text-title font-medium text-white">{s.heading}</h2>
            {s.body.map((p, pIdx) => (
              <p key={`${idx}-${pIdx}-${p.slice(0, 24)}`} className="mt-3 text-body text-subtle leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-white/8 pt-6 text-sm text-muted">
        Questions about this page?{" "}
        <Link href="/contact?topic=privacy" className="text-accent-bright hover:text-white">
          Contact us
        </Link>
        .
      </p>
    </main>
  );
}
