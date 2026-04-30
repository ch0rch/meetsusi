"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SusiNav } from "@/components/landing/susi/susi-nav";
import { SusiFooter } from "@/components/landing/susi/susi-footer";
import { useT } from "@/lib/i18n/provider";

export function AboutPage() {
  const t = useT();
  const about = t.about;

  return (
    <div className="relative isolate min-h-screen bg-white dark:bg-susi-midnight">
      <SusiNav showSignIn />

      <main className="mx-auto max-w-[720px] px-6 pt-32 pb-24 sm:pt-40 sm:pb-32">
        <Link
          href="/"
          className="susi-mono-label inline-flex items-center gap-2 text-black/55 transition-colors hover:text-black dark:text-white/55 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {about.backHome}
        </Link>

        <h1 className="susi-display-section mt-10 text-4xl text-black dark:text-white sm:text-5xl md:text-[3.5rem]">
          {about.title}
        </h1>

        <article className="mt-12 space-y-6 text-lg leading-[1.7] text-black/75 dark:text-white/75 sm:text-[1.2rem]">
          {about.paragraphs.map((paragraph, idx) => (
            <p
              key={idx}
              className={
                idx === 0 || idx === 2 || idx === 3
                  ? "text-balance text-black dark:text-white"
                  : "text-pretty"
              }
            >
              {paragraph}
            </p>
          ))}

          <p className="pt-6 font-mono text-base text-black/60 dark:text-white/60">
            {about.signature}
          </p>
        </article>
      </main>

      <SusiFooter />
    </div>
  );
}
