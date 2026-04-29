"use client";

import { useT } from "@/lib/i18n/provider";
import type { DifferentiatorItem } from "@/lib/i18n/types";
import { MonoLabel } from "./mono-label";

function WhyCard({ item }: { item: DifferentiatorItem }) {
  return (
    <div className="susi-card-light flex flex-col gap-3 p-8">
      <h3 className="text-base font-medium text-black dark:text-white">
        {item.title}
      </h3>
      <p className="text-sm leading-relaxed text-black/55 dark:text-white/50">
        {item.body}
      </p>
    </div>
  );
}

export function SusiWhy() {
  const t = useT();

  return (
    <section className="border-t border-black/8 bg-white py-24 dark:border-white/8 dark:bg-susi-midnight md:py-32">
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="mb-12">
          <MonoLabel className="mb-4">{t.why.label}</MonoLabel>
          <h2 className="susi-display-section max-w-lg text-3xl text-black dark:text-white sm:text-4xl">
            {t.why.heading}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {t.why.items.map((item) => (
            <WhyCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
