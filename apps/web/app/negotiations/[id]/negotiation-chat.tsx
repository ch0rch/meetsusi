import type { UIMessage } from "ai";
import { SusiChat } from "@/components/susi-chat";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DealInfoPanel } from "@/components/dashboard/deal-info-panel";
import { DealInfoSheet } from "@/components/dashboard/deal-info-sheet";
import type { Negotiation } from "@/lib/db/schema";

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
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-black dark:text-white">
              {negotiation.title}
            </p>
            {negotiation.vendorName ? (
              <p className="mt-0.5 text-xs text-black/50 dark:text-white/45">
                {negotiation.vendorName}
              </p>
            ) : null}
          </div>
          <StatusBadge status={negotiation.status} className="shrink-0" />
          <DealInfoSheet negotiation={negotiation} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <SusiChat
          body={{ negotiationId: negotiation.id }}
          initialMessages={[intro]}
          placeholder="Message Susi…"
        />
        <DealInfoPanel negotiation={negotiation} />
      </div>
    </div>
  );
}
