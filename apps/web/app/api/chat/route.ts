import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { gateway, buildSystemPrompt } from "@open-agents/agent";
import { getServerSession } from "@/lib/session/get-server-session";
import { createSusiTools } from "@/lib/agent/chat-tools";

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
  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt({ userName: session.user.name });
  const susiTools = createSusiTools(userId);

  const result = streamText({
    model: gateway("anthropic/claude-sonnet-4-6"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: susiTools,
    stopWhen: stepCountIs(20),
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
