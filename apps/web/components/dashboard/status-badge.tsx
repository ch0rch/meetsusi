import { cn } from "@/lib/utils";

export type NegotiationStatus =
  | "researching"
  | "awaiting_approval"
  | "negotiating"
  | "waiting_reply"
  | "won"
  | "lost"
  | "cancelled";

const CONFIG: Record<
  NegotiationStatus,
  { label: string; dot: string; pill: string }
> = {
  researching: {
    label: "Researching",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  },
  awaiting_approval: {
    label: "Needs approval",
    dot: "bg-orange-400",
    pill: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  },
  negotiating: {
    label: "Negotiating",
    dot: "bg-blue-400",
    pill: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  },
  waiting_reply: {
    label: "Waiting reply",
    dot: "bg-sky-400",
    pill: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  },
  won: {
    label: "Won",
    dot: "bg-green-400",
    pill: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  },
  lost: {
    label: "Lost",
    dot: "bg-red-400",
    pill: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-zinc-400",
    pill: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400",
  },
};

interface StatusBadgeProps {
  status: string;
  variant?: "pill" | "dot";
  className?: string;
}

export function StatusBadge({
  status,
  variant = "pill",
  className,
}: StatusBadgeProps) {
  const config = CONFIG[status as NegotiationStatus] ?? {
    label: status,
    dot: "bg-zinc-400",
    pill: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400",
  };

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
          config.dot,
          className,
        )}
        title={config.label}
      />
    );
  }

  return (
    <span
      className={cn(
        "susi-mono-label inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5",
        config.pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
