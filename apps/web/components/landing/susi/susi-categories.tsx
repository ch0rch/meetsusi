"use client";

import { useT } from "@/lib/i18n/provider";
import type { CategoryItem } from "@/lib/i18n/types";
import { MonoLabel } from "./mono-label";

function CategoryCard({ item }: { item: CategoryItem }) {
  return (
    <div className="susi-card-light flex flex-col gap-2 p-6">
      <h3 className="text-sm font-medium text-black dark:text-white">
        {item.label}
      </h3>
      <p className="text-xs leading-relaxed text-black/50 dark:text-white/40">
        {item.description}
      </p>
    </div>
  );
}

export function SusiCategories() {
  const t = useT();

  return (
    <section className="border-t border-black/8 bg-white py-24 dark:border-white/8 dark:bg-susi-midnight md:py-32">
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="mb-12">
          <MonoLabel className="mb-4">{t.categories.label}</MonoLabel>
          <h2 className="susi-display-section max-w-lg text-3xl text-black dark:text-white sm:text-4xl">
            {t.categories.heading}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.categories.items.map((item) => (
            <CategoryCard key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
