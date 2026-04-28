"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { UIMessage } from "ai";
import { SusiChat } from "@/components/susi-chat";
import type { Negotiation } from "@/lib/db/schema";

const STATUS_LABELS: Record<string, string> = {
  researching: "Researching",
  awaiting_approval: "Needs your approval",
  negotiating: "Negotiating",
  waiting_reply: "Waiting for reply",
  won: "Won",
  lost: "Lost",
  cancelled: "Cancelled",
};

function buildIntro(negotiation: Negotiation): UIMessage {
  let text = `Hi! I'm working on your negotiation with **${negotiation.vendorName ?? "the vendor"}** for **${negotiation.title}**.`;

  if (negotiation.status === "awaiting_approval") {
    text +=
      ' I have a draft email ready for your review. Just say "show me the draft" and I\'ll display it.';
  } else if (negotiation.status === "won") {
    text += ` Great news — we won! Final price: ${negotiation.finalPrice} ${negotiation.currency}.`;
  } else if (negotiation.status === "negotiating") {
    text += " The negotiation is in progress. I'll keep you posted.";
  } else {
    text += " What would you like to do?";
  }

  return {
    id: "susi-intro",
    role: "assistant",
    parts: [{ type: "text", text }],
  };
}

export function NegotiationChat({ negotiation }: { negotiation: Negotiation }) {
  const intro = buildIntro(negotiation);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link
            href="/negotiations"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{negotiation.title}</p>
            <p className="text-xs text-muted-foreground">
              {negotiation.vendorName ? `${negotiation.vendorName} · ` : ""}
              {STATUS_LABELS[negotiation.status] ?? negotiation.status}
            </p>
          </div>
        </div>
      </header>

      <SusiChat
        body={{ negotiationId: negotiation.id }}
        initialMessages={[intro]}
        placeholder="Message Susi…"
      />
    </div>
  );
}
