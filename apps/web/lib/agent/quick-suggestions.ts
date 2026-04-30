import type { Negotiation } from "@/lib/db/schema";

export interface QuickSuggestion {
  label: string;
  prompt: string;
}

type Status = Negotiation["status"];

const SUGGESTIONS_BY_STATUS: Record<Status, QuickSuggestion[]> = {
  researching: [],
  awaiting_approval: [
    { label: "Show pending draft", prompt: "Show me the pending email draft." },
    { label: "Send as-is", prompt: "Approve the email draft and send it." },
    { label: "Edit draft", prompt: "I'd like to modify the draft. " },
  ],
  negotiating: [
    { label: "Check status", prompt: "What's the latest on this negotiation?" },
    { label: "Mark as won", prompt: "I closed this deal. Mark it as won." },
    { label: "Mark as lost", prompt: "This deal fell through. Mark it as lost." },
  ],
  waiting_reply: [
    { label: "Check status", prompt: "What's the latest on this negotiation?" },
    { label: "Send a follow-up", prompt: "Let's send a polite follow-up email." },
    { label: "Mark as won", prompt: "I closed this deal. Mark it as won." },
    { label: "Mark as lost", prompt: "This deal fell through. Mark it as lost." },
  ],
  won: [],
  lost: [],
  cancelled: [],
};

export function getQuickSuggestions(status: Status): QuickSuggestion[] {
  return SUGGESTIONS_BY_STATUS[status] ?? [];
}
