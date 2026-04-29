"use client";

import { isTextUIPart, isToolUIPart } from "ai";
import type { UIMessage } from "ai";
import { EmailDraftCard } from "./email-draft-card";

const TOOL_LABELS: Record<string, string> = {
  research_market_price: "Researching market prices…",
  start_negotiation: "Creating negotiation…",
  draft_first_email: "Drafting email…",
  approve_and_dispatch: "Sending email…",
  get_negotiation_status: "Checking status…",
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? `Using ${name}…`;
}

type EmailDraftOutput = {
  subject: string;
  body: string;
  to: string;
  email_id: string;
};

interface MessageBubbleProps {
  message: UIMessage;
  onApprove?: () => void;
  onEdit?: () => void;
}

export function MessageBubble({
  message,
  onApprove,
  onEdit,
}: MessageBubbleProps) {
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

  const emailDraftPart = message.parts
    ?.filter(isToolUIPart)
    .find(
      (p) =>
        !isUser &&
        "toolName" in p &&
        p.toolName === "draft_first_email" &&
        p.state === "output-available",
    );

  const emailDraft =
    emailDraftPart?.state === "output-available" &&
    emailDraftPart.output != null
      ? (emailDraftPart.output as EmailDraftOutput)
      : null;

  const hasContent =
    textParts ||
    (pendingToolNames && pendingToolNames.length > 0) ||
    emailDraft;
  if (!hasContent) return null;

  return (
    <div
      className={`flex flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}
    >
      {textParts || (pendingToolNames && pendingToolNames.length > 0) ? (
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-foreground text-background"
              : "bg-muted text-foreground"
          }`}
        >
          {textParts ? (
            <p className="whitespace-pre-wrap">{textParts}</p>
          ) : null}
          {pendingToolNames?.map((name, i) => (
            <p key={i} className="italic text-muted-foreground">
              {toolLabel(name)}
            </p>
          ))}
        </div>
      ) : null}

      {emailDraft ? (
        <div className="w-full max-w-md">
          <EmailDraftCard
            subject={emailDraft.subject}
            body={emailDraft.body}
            to={emailDraft.to ?? ""}
            onApprove={onApprove}
            onEdit={onEdit}
          />
        </div>
      ) : null}
    </div>
  );
}
