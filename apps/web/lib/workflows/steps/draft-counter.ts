import { FatalError } from "workflow";
import { generateText } from "ai";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { emails, negotiations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { gateway } from "@open-agents/agent";
import { updateNegotiation } from "@/lib/db/negotiations";
import type { ReplyClassification } from "./classify-reply";

export async function draftCounterOfferStep(input: {
  negotiationId: string;
  vendorEmailId: string;
  classification: ReplyClassification;
}): Promise<string> {
  "use step";

  const [negotiation, vendorEmail] = await Promise.all([
    db.query.negotiations.findFirst({
      where: eq(negotiations.id, input.negotiationId),
    }),
    db.query.emails.findFirst({
      where: eq(emails.id, input.vendorEmailId),
    }),
  ]);

  if (!negotiation)
    throw new FatalError(`Negotiation ${input.negotiationId} not found`);
  if (!vendorEmail)
    throw new FatalError(`Email ${input.vendorEmailId} not found`);

  const { text } = await generateText({
    model: gateway("anthropic/claude-sonnet-4-6"),
    system: `You are Susi, a professional negotiation assistant. Draft a polite but firm counter-offer email.
Never reveal you are an AI. Write in first person as the user's representative.
Be warm but firm. Imply alternatives without threatening. Keep it brief (3-5 sentences).
Write the email in ${negotiation.language}.`,
    prompt: `Context:
- What we're negotiating: ${negotiation.title}
- Current price: ${negotiation.currentPrice} ${negotiation.currency}
- Target price: ${negotiation.targetPrice} ${negotiation.currency}
- Vendor classification: ${input.classification.kind}
- Vendor summary: ${input.classification.summary}
- Counter price offered: ${input.classification.counterPrice ?? "none"}

Vendor's email:
${vendorEmail.body}

Draft a counter-offer email body (just the body, no subject line):`,
  });

  const outboundEmails = await db.query.emails.findMany({
    where: eq(emails.negotiationId, input.negotiationId),
  });

  const lastOutbound = outboundEmails
    .filter((e) => e.direction === "outbound" && e.messageId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  const [draft] = await db
    .insert(emails)
    .values({
      id: nanoid(),
      negotiationId: input.negotiationId,
      direction: "outbound",
      fromEmail: negotiation.susiEmail,
      toEmail: vendorEmail.fromEmail,
      subject: vendorEmail.subject ? `Re: ${vendorEmail.subject}` : undefined,
      body: text,
      status: "pending_approval",
      inReplyTo: vendorEmail.messageId ?? undefined,
      emailReferences: lastOutbound?.messageId
        ? [lastOutbound.messageId]
        : undefined,
    })
    .returning();

  if (!draft) throw new FatalError("Failed to create counter-offer draft");

  await updateNegotiation(input.negotiationId, { status: "awaiting_approval" });

  return draft.id;
}

export async function draftFollowUpStep(
  negotiationId: string,
): Promise<string> {
  "use step";

  const negotiation = await db.query.negotiations.findFirst({
    where: eq(negotiations.id, negotiationId),
  });

  if (!negotiation)
    throw new FatalError(`Negotiation ${negotiationId} not found`);

  const { text } = await generateText({
    model: gateway("anthropic/claude-haiku-4.5"),
    system: `You are Susi. Draft a brief, friendly follow-up email for an unanswered price negotiation.
Keep it to 2-3 sentences. Warm and professional. Write in ${negotiation.language}.`,
    prompt: `Negotiation: ${negotiation.title}. We haven't heard back in a week. Draft a gentle follow-up.`,
  });

  const [draft] = await db
    .insert(emails)
    .values({
      id: nanoid(),
      negotiationId,
      direction: "outbound",
      fromEmail: negotiation.susiEmail,
      toEmail: negotiation.vendorEmail ?? "",
      subject: `Following up: ${negotiation.title}`,
      body: text,
      status: "pending_approval",
    })
    .returning();

  if (!draft) throw new FatalError("Failed to create follow-up draft");
  return draft.id;
}
