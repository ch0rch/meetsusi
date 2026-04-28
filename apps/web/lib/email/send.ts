interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  body: string;
  headers?: Record<string, string>;
}

interface SendEmailResult {
  id: string;
}

export async function sendNegotiationEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const payload: Record<string, unknown> = {
    from: params.from,
    to: [params.to],
    subject: params.subject,
    text: params.body,
  };

  if (params.headers?.["Reply-To"]) {
    payload["reply_to"] = params.headers["Reply-To"];
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend email send failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { id: string };
  return { id: data.id };
}
