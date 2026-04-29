"use client";

import { Check, Edit2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailDraftCardProps {
  subject: string;
  body: string;
  to: string;
  onApprove?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function EmailDraftCard({
  subject,
  body,
  to,
  onApprove,
  onEdit,
  className,
}: EmailDraftCardProps) {
  return (
    <div className={cn("susi-card-light overflow-hidden", className)}>
      <div className="flex items-center gap-2 border-b border-black/8 px-4 py-3 dark:border-white/10">
        <Mail className="h-4 w-4 shrink-0 text-black/50 dark:text-white/50" />
        <span className="susi-mono-label text-black/50 dark:text-white/40">
          Email draft
        </span>
      </div>

      <div className="space-y-0.5 border-b border-black/8 px-4 py-3 text-sm dark:border-white/10">
        <p className="text-black/50 dark:text-white/40">
          <span className="font-medium text-black/70 dark:text-white/60">
            To:
          </span>{" "}
          {to}
        </p>
        <p className="text-black/50 dark:text-white/40">
          <span className="font-medium text-black/70 dark:text-white/60">
            Subject:
          </span>{" "}
          {subject}
        </p>
      </div>

      <div className="px-4 py-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-black/80 dark:text-white/75">
          {body}
        </p>
      </div>

      <div className="flex gap-2 border-t border-black/8 px-4 py-3 dark:border-white/10">
        <button
          type="button"
          onClick={onApprove}
          className="flex items-center gap-1.5 rounded-[4px] bg-[#010120] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-85 dark:bg-white dark:text-[#010120]"
        >
          <Check className="h-3.5 w-3.5" />
          Approve &amp; send
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-[4px] border border-black/15 px-3 py-1.5 text-xs font-medium text-black/70 transition-colors hover:border-black/30 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Suggest changes
        </button>
      </div>
    </div>
  );
}
