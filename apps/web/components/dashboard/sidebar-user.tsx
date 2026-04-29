"use client";

import { signOut } from "@/lib/auth/actions";
import { LangToggle } from "@/components/landing/susi/lang-toggle";
import { SusiThemeToggle } from "@/components/landing/susi/theme-toggle";

export function SidebarUserSection({ email }: { email: string }) {
  return (
    <div className="shrink-0 border-t border-border px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <SusiThemeToggle />
        <LangToggle />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-black/45 dark:text-white/35">
          {email}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="shrink-0 text-xs text-black/35 transition-colors hover:text-black dark:text-white/30 dark:hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
