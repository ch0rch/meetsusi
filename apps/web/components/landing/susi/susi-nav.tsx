"use client";

import { SignInButton } from "@/components/auth/sign-in-button";
import { LangToggle } from "./lang-toggle";
import { SusiLogo } from "./susi-logo";
import { SusiThemeToggle } from "./theme-toggle";

type SusiNavProps = {
  showSignIn?: boolean;
};

export function SusiNav({ showSignIn = false }: SusiNavProps) {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-black/8 bg-white/80 backdrop-blur-md dark:border-white/8 dark:bg-susi-midnight/80">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-3">
        <SusiLogo />
        <div className="flex items-center gap-2">
          <LangToggle />
          <SusiThemeToggle />
          {showSignIn && <SignInButton size="sm" callbackUrl="/negotiations" />}
        </div>
      </div>
    </nav>
  );
}
