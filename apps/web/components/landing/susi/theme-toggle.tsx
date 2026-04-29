"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/providers";
import { cn } from "@/lib/utils";

export function SusiThemeToggle({ dark = false }: { dark?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center rounded-[4px] border transition-colors",
        dark
          ? "border-white/20 text-white/60 hover:text-white"
          : "border-black/15 text-black/50 hover:text-black dark:border-white/20 dark:text-white/60 dark:hover:text-white",
      )}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </button>
  );
}
