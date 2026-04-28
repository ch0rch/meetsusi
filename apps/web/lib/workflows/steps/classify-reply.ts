import { FatalError } from "workflow";
import { generateText } from "ai";
import { db } from "@/lib/db/client";
import { emails } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { gateway } from "@open-agents/agent";

export type ReplyKind =
  | "deal_accepted"
  | "counter_offer"
  | "open"
  | "qualifying_question"
  | "hard_no";

export interface ReplyClassification {
  kind: ReplyKind;
  acceptedPrice?: string;
  counterPrice?: string;
  summary: string;
}

const CLASSIFY_PROMPT = `You are classifying a vendor's email reply in a price negotiation.

Classify the reply into one of these categories:
- deal_accepted: Vendor explicitly accepted the user's price or offered a deal
- counter_offer: Vendor offered a different (usually higher) price
- open: Vendor is open to discussion but hasn't named a price
- qualifying_question: Vendor asked questions before discussing price
- hard_no: Vendor clearly refused any negotiation

Reply with a JSON object:
{
  "kind": "<one of the categories above>",
  "acceptedPrice": "<price string if deal_accepted, otherwise omit>",
  "counterPrice": "<price string if counter_offer, otherwise omit>",
  "summary": "<1-2 sentence summary of what the vendor said>"
}`;

export async function classifyReplyStep(
  emailId: string,
): Promise<ReplyClassification> {
  "use step";

  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  });

  if (!email) throw new FatalError(`Email ${emailId} not found`);

  const { text } = await generateText({
    model: gateway("anthropic/claude-haiku-4.5"),
    system: CLASSIFY_PROMPT,
    prompt: `Vendor email:\n\n${email.body}`,
  });

  try {
    const parsed = JSON.parse(text) as ReplyClassification;
    return parsed;
  } catch {
    return {
      kind: "open",
      summary: text.slice(0, 200),
    };
  }
}
