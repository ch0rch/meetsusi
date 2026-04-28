"use client";

import Link from "next/link";
import type { Negotiation } from "@/lib/db/schema";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  researching: { label: "Researching", color: "text-yellow-500" },
  awaiting_approval: { label: "Needs approval", color: "text-orange-500" },
  negotiating: { label: "Negotiating", color: "text-blue-500" },
  waiting_reply: { label: "Waiting reply", color: "text-blue-400" },
  won: { label: "Won", color: "text-green-500" },
  lost: { label: "Lost", color: "text-red-500" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground" },
};

export function NegotiationCard({ negotiation }: { negotiation: Negotiation }) {
  const status = STATUS_LABELS[negotiation.status] ?? {
    label: negotiation.status,
    color: "text-muted-foreground",
  };

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
    <Link
      href={`/negotiations/${negotiation.id}`}
      className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30 hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{negotiation.title}</p>
          {negotiation.vendorName ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {negotiation.vendorName}
            </p>
          ) : null}
        </div>
        <span className={`shrink-0 text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
        {negotiation.currentPrice ? (
          <span>
            {negotiation.currentPrice} {negotiation.currency}
          </span>
        ) : null}
        {savings ? (
          <span className="text-green-500">
            −{savings} {negotiation.currency} saved
          </span>
        ) : null}
        <span className="ml-auto text-xs">
          {new Date(negotiation.createdAt).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
