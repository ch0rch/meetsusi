import type { ReactNode } from "react";
import type { Negotiation } from "@/lib/db/schema";
import { StatusBadge } from "./status-badge";

export function DealInfoPanel({ negotiation }: { negotiation: Negotiation }) {
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
    <aside className="hidden w-72 shrink-0 flex-col gap-6 overflow-y-auto border-l border-border px-5 py-6 sidebar:flex">
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
    </aside>
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
