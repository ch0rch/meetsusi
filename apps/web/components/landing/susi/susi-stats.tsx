"use client";

import { useT } from "@/lib/i18n/provider";
import type { StatEntry } from "@/lib/i18n/types";
import { MonoLabel } from "./mono-label";

function StatCard({ stat }: { stat: StatEntry }) {
  return (
    <div className="susi-card-light flex flex-col gap-3 p-8">
      <p className="susi-display-section text-5xl text-black dark:text-white sm:text-6xl">
        {stat.value}
      </p>
      <p className="text-sm leading-relaxed text-black/55 dark:text-white/50">
        {stat.description}
      </p>
    </div>
  );
}

export function SusiStats() {
  const t = useT();

  return (
    <section className="bg-white py-12 dark:bg-susi-midnight md:py-20">
      <div className="mx-auto max-w-[1320px] px-6">
        <MonoLabel className="mb-8">{t.stats.label}</MonoLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard stat={t.stats.cars} />
          <StatCard stat={t.stats.saas} />
          <StatCard stat={t.stats.rent} />
        </div>
      </div>
    </section>
  );
}
