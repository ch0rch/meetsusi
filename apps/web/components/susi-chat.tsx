"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, isToolUIPart } from "ai";
import { Send } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import type { UIMessage } from "ai";

interface SusiChatProps {
  apiUrl?: string;
  body?: Record<string, unknown>;
  initialMessages?: UIMessage[];
  placeholder?: string;
  onNegotiationCreated?: (negotiationId: string) => void;
}

export function SusiChat({
  apiUrl = "/api/chat",
  body,
  initialMessages,
  placeholder = "Message Susi…",
  onNegotiationCreated,
}: SusiChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: apiUrl, body }),
    messages: initialMessages,
    onFinish: ({ messages: allMessages }) => {
      if (!onNegotiationCreated) return;
      for (const msg of allMessages) {
        for (const part of msg.parts ?? []) {
          if (
            isToolUIPart(part) &&
            part.type === "dynamic-tool" &&
            "toolName" in part &&
            part.toolName === "start_negotiation" &&
            part.state === "output-available"
          ) {
            const result = part.output as { negotiation_id?: string };
            if (result.negotiation_id) {
              onNegotiationCreated(result.negotiation_id);
              return;
            }
          }
        }
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "streaming" || status === "submitted";

  function submit() {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/50"
            style={{ maxHeight: 120 }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  const textParts = message.parts
    ?.filter(isTextUIPart)
    .map((p) => p.text)
    .join("");

  const pendingToolNames = message.parts
    ?.filter(isToolUIPart)
    .filter(
      (p) => p.state === "input-streaming" || p.state === "input-available",
    )
    .map((p) =>
      "toolName" in p ? (p.toolName as string) : p.type.replace("tool-", ""),
    );

  if (!textParts && (!pendingToolNames || pendingToolNames.length === 0)) {
    return null;
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-foreground text-background" : "bg-muted text-foreground"
        }`}
      >
        {textParts ? <p className="whitespace-pre-wrap">{textParts}</p> : null}
        {pendingToolNames?.map((name, i) => (
          <p key={i} className="italic text-muted-foreground">
            {toolLabel(name)}
          </p>
        ))}
      </div>
    </div>
  );
}

function toolLabel(toolName: string): string {
  const labels: Record<string, string> = {
    research_market_price: "Researching market prices…",
    start_negotiation: "Creating negotiation…",
    draft_first_email: "Drafting email…",
    approve_and_dispatch: "Sending email…",
    get_negotiation_status: "Checking status…",
    ask_user_question: "Thinking…",
  };
  return labels[toolName] ?? `Using ${toolName}…`;
}
