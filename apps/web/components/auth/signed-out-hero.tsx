"use client";

import { useEffect, useRef, useState } from "react";
import { SusiNav } from "@/components/landing/susi/susi-nav";
import { SusiHero } from "@/components/landing/susi/susi-hero";
import { SusiProblem } from "@/components/landing/susi/susi-problem";
import { SusiStats } from "@/components/landing/susi/susi-stats";
import { SusiHow } from "@/components/landing/susi/susi-how";
import { SusiCategories } from "@/components/landing/susi/susi-categories";
import { SusiWhy } from "@/components/landing/susi/susi-why";
import { SusiTech } from "@/components/landing/susi/susi-tech";
import { SusiFinalCta } from "@/components/landing/susi/susi-final-cta";
import { SusiFooter } from "@/components/landing/susi/susi-footer";

export function SignedOutHero() {
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const [heroButtonsVisible, setHeroButtonsVisible] = useState(true);

  useEffect(() => {
    const el = heroButtonsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroButtonsVisible(entry?.isIntersecting ?? true),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative isolate min-h-screen">
      <SusiNav showSignIn={!heroButtonsVisible} />
      <SusiHero buttonsRef={heroButtonsRef} />
      <SusiProblem />
      <SusiStats />
      <SusiHow />
      <SusiCategories />
      <SusiWhy />
      <SusiTech />
      <SusiFinalCta />
      <SusiFooter />
    </div>
  );
}
