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
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Missing Cloudflare email configuration");
  }

  const payload = {
    from: { email: params.from },
    to: [{ email: params.to }],
    subject: params.subject,
    content: [{ type: "text/plain", value: params.body }],
    // Cloudflare Email Service doesn't accept arbitrary headers in the REST API.
    // Threading (Message-ID, In-Reply-To, References) is persisted in our DB
    // for reference; we embed them as X- prefixed headers where supported.
    ...(params.headers && {
      reply_to: params.headers["Reply-To"]
        ? { email: params.headers["Reply-To"] }
        : undefined,
    }),
  };

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudflare email send failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { result: { id: string } };
  return { id: data.result.id };
}
