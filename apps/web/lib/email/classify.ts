const AUTO_REPLY_PATTERNS = [
  /out of office/i,
  /auto.?reply/i,
  /automatic.?reply/i,
  /i am (currently )?out/i,
  /vacation/i,
  /away from (my )?email/i,
  /thank you for (your )?email/i,
  /this is an automated/i,
];

const BOUNCE_SUBJECTS = [
  /delivery (status )?notification/i,
  /undeliverable/i,
  /mail delivery failed/i,
  /returned mail/i,
];

export interface EmailClassification {
  isAutoReply: boolean;
  isBounce: boolean;
  isRealReply: boolean;
}

export function classifyInboundEmail(opts: {
  subject?: string;
  body: string;
  headers?: Record<string, string>;
}): EmailClassification {
  const { subject = "", body, headers = {} } = opts;

  const isBounce =
    BOUNCE_SUBJECTS.some((p) => p.test(subject)) ||
    headers["x-failed-recipients"] !== undefined;

  const isAutoReply =
    !isBounce &&
    (AUTO_REPLY_PATTERNS.some((p) => p.test(body)) ||
      AUTO_REPLY_PATTERNS.some((p) => p.test(subject)) ||
      headers["auto-submitted"]?.toLowerCase() === "auto-replied" ||
      headers["x-auto-response-suppress"] !== undefined);

  return {
    isAutoReply,
    isBounce,
    isRealReply: !isAutoReply && !isBounce,
  };
}
