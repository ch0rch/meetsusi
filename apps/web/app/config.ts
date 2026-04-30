import { gateway } from "@open-agents/agent";

// Chat orchestration: where 80% of token volume lives.
// Haiku 4.5 is purpose-built for multi-step tool use and keeps the demo affordable.
export const SUSI_CHAT_MODEL = gateway("anthropic/claude-haiku-4.5");

// Email drafting (first outreach + counter-offers): user-facing content that
// gets reviewed and approved. Sonnet's nuance pays off here, especially in
// non-English languages. Volume is small (~3 short generations per negotiation).
export const SUSI_DRAFT_MODEL = gateway("anthropic/claude-sonnet-4-6");
