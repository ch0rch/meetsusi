"use client";

import { SignInButton } from "@/components/auth/sign-in-button";
import { useT } from "@/lib/i18n/provider";

export function SusiFinalCta() {
  const t = useT();

  return (
    <section className="border-t border-white/10 bg-susi-midnight py-24 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 text-center">
        <h2 className="susi-display-section text-3xl text-white sm:text-4xl md:text-5xl">
          {t.finalCta.heading}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
          {t.finalCta.body}
        </p>
        <div className="mt-10">
          <SignInButton
            size="lg"
            callbackUrl="/negotiations"
            className="rounded-[4px] bg-white px-8 text-susi-midnight hover:bg-white/90"
          />
        </div>
      </div>
    </section>
  );
}
