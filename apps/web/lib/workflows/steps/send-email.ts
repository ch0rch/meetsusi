import { FatalError } from "workflow";
import { db } from "@/lib/db/client";
import { emails, negotiations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendNegotiationEmail } from "@/lib/email/send";
import { buildOutboundHeaders } from "@/lib/email/threading";
import { updateNegotiation } from "@/lib/db/negotiations";

export async function sendApprovedEmailStep(
  emailId: string,
): Promise<{ messageId: string }> {
  "use step";

  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  });

  if (!email) throw new FatalError(`Email ${emailId} not found`);
  if (email.status !== "approved") {
    throw new FatalError(
      `Email ${emailId} is not approved (status=${email.status})`,
    );
  }

  const negotiation = await db.query.negotiations.findFirst({
    where: eq(negotiations.id, email.negotiationId),
  });

  if (!negotiation)
    throw new FatalError(`Negotiation not found for email ${emailId}`);

  const { messageId, headers } = buildOutboundHeaders({
    negotiationId: email.negotiationId,
    inReplyToMessageId: email.inReplyTo ?? undefined,
    references: email.emailReferences ?? [],
  });

  await sendNegotiationEmail({
    from: `Susi <${negotiation.susiEmail}>`,
    to: email.toEmail,
    subject: email.subject ?? `Re: ${negotiation.title}`,
    body: email.body,
    headers,
  });

  await db
    .update(emails)
    .set({
      status: "sent",
      sentAt: new Date(),
      messageId,
    })
    .where(eq(emails.id, emailId));

  await updateNegotiation(email.negotiationId, { status: "waiting_reply" });

  return { messageId };
}
