import { eq, and, desc, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./client";
import {
  negotiations,
  emails,
  messages,
  type Negotiation,
  type NewNegotiation,
  type Email,
  type NewEmail,
  type Message,
} from "./schema";

// ---------------------------------------------------------------------------
// Negotiations
// ---------------------------------------------------------------------------

export async function createNegotiation(
  input: Omit<NewNegotiation, "createdAt" | "updatedAt"> & { id?: string },
): Promise<Negotiation> {
  const [row] = await db
    .insert(negotiations)
    .values({ ...input, id: input.id ?? nanoid() })
    .returning();
  if (!row) throw new Error("Failed to create negotiation");
  return row;
}

export async function getNegotiationById(
  id: string,
): Promise<Negotiation | undefined> {
  return db.query.negotiations.findFirst({
    where: eq(negotiations.id, id),
  });
}

export async function getNegotiationByIdForUser(
  id: string,
  userId: string,
): Promise<Negotiation | undefined> {
  return db.query.negotiations.findFirst({
    where: and(eq(negotiations.id, id), eq(negotiations.userId, userId)),
  });
}

export async function getNegotiationsBySusiEmail(
  susiEmail: string,
): Promise<Negotiation | undefined> {
  return db.query.negotiations.findFirst({
    where: eq(negotiations.susiEmail, susiEmail),
  });
}

export async function listNegotiationsForUser(
  userId: string,
): Promise<Negotiation[]> {
  return db.query.negotiations.findMany({
    where: eq(negotiations.userId, userId),
    orderBy: [desc(negotiations.createdAt)],
  });
}

export async function countNegotiationsForUser(
  userId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(negotiations)
    .where(eq(negotiations.userId, userId));
  return row?.value ?? 0;
}

export async function updateNegotiation(
  id: string,
  patch: Partial<
    Pick<
      Negotiation,
      | "status"
      | "workflowRunId"
      | "workflowStatus"
      | "finalPrice"
      | "roundsCompleted"
      | "wonAt"
      | "lostAt"
      | "updatedAt"
    >
  >,
): Promise<void> {
  await db
    .update(negotiations)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(negotiations.id, id));
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

export async function createEmail(
  input: Omit<NewEmail, "id" | "createdAt">,
): Promise<Email> {
  const [row] = await db
    .insert(emails)
    .values({ ...input, id: nanoid() })
    .returning();
  if (!row) throw new Error("Failed to create email");
  return row;
}

export async function getEmailById(id: string): Promise<Email | undefined> {
  return db.query.emails.findFirst({ where: eq(emails.id, id) });
}

export async function getEmailByExternalId(
  externalId: string,
): Promise<Email | undefined> {
  return db.query.emails.findFirst({
    where: eq(emails.externalId, externalId),
  });
}

export async function updateEmail(
  id: string,
  patch: Partial<
    Pick<
      Email,
      | "status"
      | "approvedByUserAt"
      | "sentAt"
      | "receivedAt"
      | "failedReason"
      | "messageId"
      | "inReplyTo"
      | "emailReferences"
    >
  >,
): Promise<void> {
  await db.update(emails).set(patch).where(eq(emails.id, id));
}

export async function failPendingDraftsForNegotiation(
  negotiationId: string,
  reason: string,
): Promise<number> {
  const updated = await db
    .update(emails)
    .set({ status: "failed", failedReason: reason })
    .where(
      and(
        eq(emails.negotiationId, negotiationId),
        eq(emails.status, "pending_approval"),
      ),
    )
    .returning({ id: emails.id });
  return updated.length;
}

export async function listEmailsForNegotiation(
  negotiationId: string,
): Promise<Email[]> {
  return db.query.emails.findMany({
    where: eq(emails.negotiationId, negotiationId),
    orderBy: [desc(emails.createdAt)],
  });
}

export async function isFirstEmailOfNegotiation(
  negotiationId: string,
): Promise<boolean> {
  const rows = await db.query.emails.findMany({
    where: and(
      eq(emails.negotiationId, negotiationId),
      eq(emails.direction, "outbound"),
    ),
  });
  return rows.length <= 1;
}

// ---------------------------------------------------------------------------
// Messages (chat)
// ---------------------------------------------------------------------------

export async function saveMessage(
  input: Omit<Message, "id" | "createdAt">,
): Promise<Message> {
  const [row] = await db
    .insert(messages)
    .values({ ...input, id: nanoid() })
    .returning();
  if (!row) throw new Error("Failed to save message");
  return row;
}

export async function listMessagesForNegotiation(
  negotiationId: string,
): Promise<Message[]> {
  return db.query.messages.findMany({
    where: eq(messages.negotiationId, negotiationId),
    orderBy: [desc(messages.createdAt)],
  });
}
