import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { buildSystemPrompt } from "@open-agents/agent";
import { getServerSession } from "@/lib/session/get-server-session";
import { createSusiTools } from "@/lib/agent/chat-tools";
import { saveMessage } from "@/lib/db/negotiations";
import { SUSI_CHAT_MODEL } from "@/app/config";
import { classifyNegotiationTopic } from "@/lib/agent/topic-guardrail";

export const maxDuration = 60;

interface ChatRequest {
  messages: UIMessage[];
  negotiationId?: string;
}

export async function POST(req: Request): Promise<Response> {
  const session = await getServerSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const body = (await req.json()) as ChatRequest;
  const { messages, negotiationId } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const lastMsg = messages[messages.length - 1];
  const userText =
    lastMsg?.role === "user"
      ? (lastMsg.parts
          ?.filter(
            (p): p is Extract<typeof p, { type: "text" }> => p.type === "text",
          )
          .map((p) => p.text)
          .join("") ?? "")
      : "";

  // Topic guardrail: classify before engaging the main model.
  // Fails open — if the classifier errors we let the message through.
  if (userText) {
    try {
      const guardrail = await classifyNegotiationTopic(userText);
      if (!guardrail.allowed) {
        const refusal = streamText({
          model: SUSI_CHAT_MODEL,
          system:
            "You are Susi, a personal negotiation assistant. The user sent a message outside your scope. Respond warmly but in 1-2 sentences max — explain you specialize in negotiation assistance and invite them to share what they'd like to negotiate.",
          messages: [{ role: "user", content: userText }],
          maxOutputTokens: 100,
          temperature: 0.5,
        });
        return refusal.toUIMessageStreamResponse();
      }
    } catch {
      // fail open — guardrail error should not block the user
    }
  }

  const systemPrompt = buildSystemPrompt({
    userName: session.user.name,
    negotiationId,
  });
  const susiTools = createSusiTools(userId, session.user.email);

  // Persist the new user message before streaming (only on-topic messages)
  if (negotiationId && lastMsg?.role === "user" && userText) {
    await saveMessage({
      negotiationId,
      userId,
      role: "user",
      content: userText,
      parts: lastMsg.parts ?? [],
    });
  }

  const result = streamText({
    model: SUSI_CHAT_MODEL,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: susiTools,
    stopWhen: stepCountIs(20),
    temperature: 0.7,
    onFinish: async ({ text }) => {
      if (negotiationId && text) {
        await saveMessage({
          negotiationId,
          userId,
          role: "assistant",
          content: text,
          parts: [{ type: "text", text }],
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
