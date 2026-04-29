"use client";

import Link from "next/link";
import { Menu, Plus, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Negotiation } from "@/lib/db/schema";
import { StatusBadge } from "./status-badge";
import { SidebarUserSection } from "./sidebar-user";

interface MobileTopBarProps {
  negotiations: Negotiation[];
  userEmail: string;
}

export function MobileTopBar({ negotiations, userEmail }: MobileTopBarProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sidebar:hidden">
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="rounded-md p-1.5 text-black/60 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/8"
          >
            <Menu className="h-5 w-5" />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background shadow-xl focus:outline-none">
            <div className="flex shrink-0 items-center justify-between px-5 py-5">
              <Dialog.Close asChild>
                <Link
                  href="/negotiations"
                  className="font-mono text-base font-bold tracking-tight text-black dark:text-white"
                >
                  susi
                </Link>
              </Dialog.Close>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-black/40 hover:bg-black/5 dark:text-white/30 dark:hover:bg-white/8"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="shrink-0 px-3 pb-4">
              <Dialog.Close asChild>
                <Link
                  href="/negotiations/new"
                  className="flex w-full items-center gap-2 rounded-[6px] bg-[#010120] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 dark:bg-white dark:text-[#010120]"
                >
                  <Plus className="h-4 w-4" />
                  New negotiation
                </Link>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {negotiations.length > 0 ? (
                <>
                  <p className="susi-mono-label mb-2 px-2 text-black/35 dark:text-white/30">
                    Recent
                  </p>
                  <nav className="space-y-0.5">
                    {negotiations.map((n) => (
                      <Dialog.Close key={n.id} asChild>
                        <Link
                          href={`/negotiations/${n.id}`}
                          className="flex items-center gap-2.5 rounded-[6px] px-2 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/6"
                        >
                          <StatusBadge
                            status={n.status}
                            variant="dot"
                            className="shrink-0"
                          />
                          <span className="min-w-0 flex-1 truncate text-black/75 dark:text-white/70">
                            {n.title}
                          </span>
                        </Link>
                      </Dialog.Close>
                    ))}
                  </nav>
                </>
              ) : (
                <p className="px-2 text-xs text-black/35 dark:text-white/30">
                  No negotiations yet
                </p>
              )}
            </div>

            <SidebarUserSection email={userEmail} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Link
        href="/negotiations"
        className="font-mono text-base font-bold tracking-tight text-black dark:text-white"
      >
        susi
      </Link>

      <Link
        href="/negotiations/new"
        className="rounded-md p-1.5 text-black/60 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/8"
      >
        <Plus className="h-5 w-5" />
      </Link>
    </div>
  );
}
