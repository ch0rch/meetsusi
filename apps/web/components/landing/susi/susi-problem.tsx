"use client";

import { useT } from "@/lib/i18n/provider";
import { MonoLabel } from "./mono-label";

export function SusiProblem() {
  const t = useT();

  return (
    <section className="bg-white py-24 dark:bg-susi-midnight md:py-32">
      <div className="mx-auto max-w-[1320px] px-6">
        <MonoLabel className="mb-6">{t.problem.label}</MonoLabel>
        <div className="max-w-3xl">
          <h2 className="susi-display-section text-3xl text-black dark:text-white sm:text-4xl md:text-5xl">
            {t.problem.heading}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-black/55 dark:text-white/50 sm:text-lg">
            {t.problem.body}
          </p>
        </div>
      </div>
    </section>
  );
}
