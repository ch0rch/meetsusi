import { nanoid } from "nanoid";

const EMAIL_DOMAIN = process.env.CLOUDFLARE_EMAIL_DOMAIN ?? "meetsusi.com";

export function generateMessageId(negotiationId: string): string {
  return `<${nanoid()}.${negotiationId}@${EMAIL_DOMAIN}>`;
}

export function buildOutboundHeaders(opts: {
  negotiationId: string;
  inReplyToMessageId?: string;
  references?: string[];
}): { messageId: string; headers: Record<string, string> } {
  const messageId = generateMessageId(opts.negotiationId);

  const headers: Record<string, string> = {
    "Message-ID": messageId,
  };

  if (opts.inReplyToMessageId) {
    headers["In-Reply-To"] = opts.inReplyToMessageId;
  }

  if (opts.references && opts.references.length > 0) {
    const allRefs = opts.inReplyToMessageId
      ? [...opts.references, opts.inReplyToMessageId]
      : opts.references;
    headers["References"] = [...new Set(allRefs)].join(" ");
  }

  return { messageId, headers };
}

export function generateSusiEmail(negotiationId: string): string {
  const shortId = negotiationId.slice(0, 8).toLowerCase();
  return `negotiate-${shortId}@${EMAIL_DOMAIN}`;
}
