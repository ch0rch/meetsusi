"use client";

import { useT } from "@/lib/i18n/provider";
import type { Step } from "@/lib/i18n/types";
import { MonoLabel } from "./mono-label";

function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <div className="susi-card-light flex flex-col gap-4 p-8">
      <span className="susi-mono-label text-black/30 dark:text-white/30">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="susi-display-section text-xl text-black dark:text-white sm:text-2xl">
        {step.title}
      </h3>
      <p className="text-sm leading-relaxed text-black/55 dark:text-white/50">
        {step.body}
      </p>
    </div>
  );
}

export function SusiHow() {
  const t = useT();

  return (
    <section className="bg-white py-24 dark:bg-susi-midnight md:py-32">
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="mb-12">
          <MonoLabel className="mb-4">{t.how.label}</MonoLabel>
          <h2 className="susi-display-section max-w-lg text-3xl text-black dark:text-white sm:text-4xl">
            {t.how.heading}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {t.how.steps.map((step, i) => (
            <StepCard key={step.title} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
