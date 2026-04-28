import { nanoid } from "nanoid";
import PostalMime from "postal-mime";
import { resumeHook } from "workflow/api";
import { db } from "@/lib/db/client";
import { emails } from "@/lib/db/schema";
import {
  getNegotiationsBySusiEmail,
  getEmailByExternalId,
} from "@/lib/db/negotiations";
import { verifyHmacSignature } from "@/lib/security/hmac";
import { classifyInboundEmail } from "@/lib/email/classify";

export const maxDuration = 30;

interface CloudflareEmailPayload {
  to: string;
  from: string;
  subject?: string;
  messageId?: string;
  headers?: Record<string, string>;
  raw?: string;
}

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.CLOUDFLARE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("x-cloudflare-signature") ?? "";
  const rawBody = await req.text();

  if (!verifyHmacSignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: CloudflareEmailPayload;
  try {
    payload = JSON.parse(rawBody) as CloudflareEmailPayload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { to, from, headers = {} } = payload;

  // Parse text body from raw MIME if available
  let subject = payload.subject;
  let messageId = payload.messageId;
  let text = "";
  const parsedHeaders = { ...headers };

  if (payload.raw) {
    const parsed = await new PostalMime().parse(payload.raw);
    text = parsed.text ?? "";
    subject = subject ?? parsed.subject ?? undefined;
    messageId = messageId ?? parsed.messageId ?? undefined;
    for (const h of parsed.headers ?? []) {
      parsedHeaders[h.key.toLowerCase()] = h.value;
    }
  }

  // Find negotiation by the susi_email the vendor replied to
  const negotiation = await getNegotiationsBySusiEmail(to);
  if (!negotiation) {
    return Response.json({ ok: true }); // Not a Susi address — ignore silently
  }

  // Deduplicate by message-id (idempotency)
  const externalId = messageId ?? `${from}:${Date.now()}`;
  const existing = await getEmailByExternalId(externalId);
  if (existing) {
    return Response.json({ ok: true, duplicate: true });
  }

  const classification = classifyInboundEmail({
    subject,
    body: text,
    headers: parsedHeaders,
  });

  const inReplyTo =
    parsedHeaders["in-reply-to"] ?? parsedHeaders["In-Reply-To"] ?? undefined;
  const referencesHeader =
    parsedHeaders["references"] ?? parsedHeaders["References"];
  const emailReferences = referencesHeader
    ? referencesHeader.split(/\s+/).filter(Boolean)
    : [];

  const [inserted] = await db
    .insert(emails)
    .values({
      id: nanoid(),
      negotiationId: negotiation.id,
      direction: "inbound",
      fromEmail: from,
      toEmail: to,
      subject,
      body: text,
      status: "received",
      receivedAt: new Date(),
      messageId: messageId ?? undefined,
      inReplyTo,
      emailReferences: emailReferences.length > 0 ? emailReferences : undefined,
      externalId,
      isAutoReply: classification.isAutoReply,
      isBounce: classification.isBounce,
    })
    .returning();

  if (!inserted) {
    return Response.json({ error: "Failed to save email" }, { status: 500 });
  }

  // Wake up the waiting workflow with the new email id
  if (classification.isRealReply) {
    await resumeHook(`vendor_replied:${negotiation.id}`, {
      emailId: inserted.id,
    });
  }

  return Response.json({ ok: true });
}
