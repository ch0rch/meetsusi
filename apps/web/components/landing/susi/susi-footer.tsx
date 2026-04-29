"use client";

import { useT } from "@/lib/i18n/provider";
import { LangToggle } from "./lang-toggle";
import { SusiThemeToggle } from "./theme-toggle";

export function SusiFooter() {
  const t = useT();

  return (
    <footer className="border-t border-white/10 bg-susi-midnight">
      <div className="mx-auto max-w-[1320px] px-6 pt-16 pb-10">
        <div className="mb-12 overflow-hidden">
          <p
            className="select-none font-mono font-bold text-white/8 leading-none"
            style={{
              fontSize: "clamp(4rem, 18vw, 14rem)",
              letterSpacing: "-0.06em",
            }}
            aria-hidden="true"
          >
            susi
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="susi-mono-label text-white/40">{t.footer.tagline}</p>
          <div className="flex items-center gap-2">
            <LangToggle dark />
            <SusiThemeToggle dark />
          </div>
        </div>

        <div className="mt-8 border-t border-white/8 pt-8">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} Meet Susi. Built for Vercel Zero to
            Agent Hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
}
