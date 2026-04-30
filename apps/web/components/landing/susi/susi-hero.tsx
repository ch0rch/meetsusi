"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { useT } from "@/lib/i18n/provider";

type SusiHeroProps = {
  buttonsRef: RefObject<HTMLDivElement | null>;
};

export function SusiHero({ buttonsRef }: SusiHeroProps) {
  const t = useT();

  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      <Image
        src="/hero-susi.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/40 to-white/70 dark:from-[#010120]/75 dark:via-[#010120]/65 dark:to-[#010120]/85"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-[1320px] flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="susi-display-hero max-w-3xl text-5xl text-black dark:text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
          {t.hero.tagline}
        </h1>
        <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-black/70 dark:text-white/70 sm:text-lg">
          {t.hero.subtitle}
        </p>
        <div
          ref={buttonsRef}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <SignInButton
            size="lg"
            callbackUrl="/negotiations"
            className="rounded-[4px] bg-[#010120] px-6 text-white hover:bg-[#010120]/85 dark:bg-white dark:text-[#010120] dark:hover:bg-white/90"
          />
        </div>
      </div>
    </section>
  );
}
