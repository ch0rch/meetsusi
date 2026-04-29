"use client";

import { useLang } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const LANGS: Lang[] = ["en", "es"];

export function LangToggle({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang();

  return (
    <div
      className={cn(
        "flex items-center overflow-hidden rounded-[4px] border font-mono text-xs font-medium",
        dark ? "border-white/20" : "border-black/15 dark:border-white/20",
      )}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "cursor-pointer px-2.5 py-1 uppercase transition-colors",
            lang === l
              ? dark
                ? "bg-white/15 text-white"
                : "bg-black/8 text-black dark:bg-white/15 dark:text-white"
              : dark
                ? "text-white/50 hover:text-white/80"
                : "text-black/40 hover:text-black/70 dark:text-white/50 dark:hover:text-white/80",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
