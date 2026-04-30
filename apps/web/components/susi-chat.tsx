"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { useRef, useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatTyping } from "@/components/chat/chat-typing";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import type { QuickSuggestion } from "@/lib/agent/quick-suggestions";

interface SusiChatProps {
  apiUrl?: string;
  body?: Record<string, unknown>;
  initialMessages?: UIMessage[];
  placeholder?: string;
  suggestions?: QuickSuggestion[];
  onNegotiationCreated?: (negotiationId: string) => void;
}

export function SusiChat({
  apiUrl = "/api/chat",
  body,
  initialMessages,
  placeholder = "Message Susi…",
  suggestions,
  onNegotiationCreated,
}: SusiChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  function handleApprove() {
    sendMessage({ text: "Approve the email draft and send it." });
  }

  function handleEdit() {
    setInput("Please modify the draft: ");
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleSuggestion(suggestion: QuickSuggestion) {
    if (isLoading) return;
    // Prompts that end with a space are starters meant for the user to complete.
    if (suggestion.prompt.endsWith(" ")) {
      setInput(suggestion.prompt);
      setTimeout(() => textareaRef.current?.focus(), 0);
      return;
    }
    sendMessage({ text: suggestion.prompt });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onApprove={handleApprove}
              onEdit={handleEdit}
            />
          ))}

          {isLoading ? <ChatTyping /> : null}

          <div ref={bottomRef} />
        </div>
      </div>

      {suggestions && suggestions.length > 0 ? (
        <div className="shrink-0 border-t border-border px-6 pt-3">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            {suggestions.map((s) => (
              <PromptSuggestion
                key={s.label}
                size="sm"
                onClick={() => handleSuggestion(s)}
                disabled={isLoading}
              >
                {s.label}
              </PromptSuggestion>
            ))}
          </div>
        </div>
      ) : null}

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={submit}
        disabled={isLoading}
        placeholder={placeholder}
        textareaRef={textareaRef}
      />
    </div>
  );
}
