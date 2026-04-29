"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Negotiation } from "@/lib/db/schema";
import { StatusBadge } from "./status-badge";

export function DealInfoSheet({ negotiation }: { negotiation: Negotiation }) {
  const savings =
    negotiation.status === "won" &&
    negotiation.currentPrice &&
    negotiation.finalPrice
      ? (
          parseFloat(negotiation.currentPrice) -
          parseFloat(negotiation.finalPrice)
        ).toFixed(2)
      : null;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="rounded-md p-1.5 text-black/50 hover:bg-black/5 dark:text-white/40 dark:hover:bg-white/8 sidebar:hidden"
        >
          <Info className="h-4 w-4" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col gap-6 overflow-y-auto bg-background px-5 py-6 shadow-xl focus:outline-none">
          <div>
            <p className="susi-mono-label mb-4 text-black/40 dark:text-white/30">
              Deal Info
            </p>
            <div className="space-y-3.5">
              <InfoRow label="Status">
                <StatusBadge status={negotiation.status} />
              </InfoRow>
              {negotiation.vendorName ? (
                <InfoRow label="Vendor">{negotiation.vendorName}</InfoRow>
              ) : null}
              {negotiation.vendorEmail ? (
                <InfoRow label="Contact">{negotiation.vendorEmail}</InfoRow>
              ) : null}
              {negotiation.currentPrice ? (
                <InfoRow label="Current price">
                  {negotiation.currentPrice} {negotiation.currency}
                </InfoRow>
              ) : null}
              {negotiation.targetPrice ? (
                <InfoRow label="Target">
                  {negotiation.targetPrice} {negotiation.currency}
                </InfoRow>
              ) : null}
              {savings ? (
                <InfoRow label="Saved">
                  <span className="text-green-600 dark:text-green-400">
                    −{savings} {negotiation.currency}
                  </span>
                </InfoRow>
              ) : null}
              {negotiation.roundsCompleted > 0 ? (
                <InfoRow label="Rounds">{negotiation.roundsCompleted}</InfoRow>
              ) : null}
              <InfoRow label="Started">
                {new Date(negotiation.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </InfoRow>
            </div>
          </div>

          {negotiation.context ? (
            <div>
              <p className="susi-mono-label mb-2 text-black/40 dark:text-white/30">
                Context
              </p>
              <p className="text-sm leading-relaxed text-black/60 dark:text-white/50">
                {negotiation.context}
              </p>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs text-black/40 dark:text-white/30">
        {label}
      </span>
      <span className="text-right text-xs font-medium text-black/75 dark:text-white/65">
        {children}
      </span>
    </div>
  );
}
