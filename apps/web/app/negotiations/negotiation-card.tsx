"use client";

import Link from "next/link";
import type { Negotiation } from "@/lib/db/schema";
import { StatusBadge } from "@/components/dashboard/status-badge";

export function NegotiationCard({ negotiation }: { negotiation: Negotiation }) {
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
      className="susi-card-light block p-5 transition-shadow hover:shadow-susi-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-black dark:text-white">
            {negotiation.title}
          </p>
          {negotiation.vendorName ? (
            <p className="mt-0.5 text-sm text-black/50 dark:text-white/45">
              {negotiation.vendorName}
            </p>
          ) : null}
        </div>
        <StatusBadge status={negotiation.status} className="shrink-0" />
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-black/45 dark:text-white/35">
        {negotiation.currentPrice ? (
          <span>
            {negotiation.currentPrice} {negotiation.currency}
          </span>
        ) : null}
        {savings ? (
          <span className="text-green-600 dark:text-green-400">
            −{savings} {negotiation.currency} saved
          </span>
        ) : null}
        <span className="ml-auto">
          {new Date(negotiation.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </Link>
  );
}
