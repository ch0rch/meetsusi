import Link from "next/link";
import { Plus } from "lucide-react";
import type { Negotiation } from "@/lib/db/schema";
import { StatusBadge } from "./status-badge";
import { SidebarUserSection } from "./sidebar-user";

interface DashboardSidebarProps {
  negotiations: Negotiation[];
  userEmail: string;
}

export function DashboardSidebar({
  negotiations,
  userEmail,
}: DashboardSidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background sidebar:flex">
      {/* Logo */}
      <div className="shrink-0 px-5 py-5">
        <Link href="/negotiations">
          <span className="font-mono text-base font-bold tracking-tight text-black select-none dark:text-white">
            susi
          </span>
        </Link>
      </div>

      {/* New negotiation CTA */}
      <div className="shrink-0 px-3 pb-4">
        <Link
          href="/negotiations/new"
          className="flex w-full items-center gap-2 rounded-[6px] bg-[#010120] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 dark:bg-white dark:text-[#010120]"
        >
          <Plus className="h-4 w-4" />
          New negotiation
        </Link>
      </div>

      {/* Recent negotiations */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {negotiations.length > 0 ? (
          <>
            <p className="susi-mono-label mb-2 px-2 text-black/35 dark:text-white/30">
              Recent
            </p>
            <nav className="space-y-0.5">
              {negotiations.map((n) => (
                <Link
                  key={n.id}
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
              ))}
            </nav>
          </>
        ) : (
          <p className="px-2 text-xs text-black/35 dark:text-white/30">
            No negotiations yet
          </p>
        )}
      </div>

      {/* User section */}
      <SidebarUserSection email={userEmail} />
    </aside>
  );
}
