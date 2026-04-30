"use client";

import { AlertCircle } from "lucide-react";
import { isTextUIPart, isToolUIPart } from "ai";
import type { UIMessage } from "ai";
import { Markdown } from "@/components/ui/markdown";
import { EmailDraftCard } from "./email-draft-card";

const TOOL_LABELS: Record<string, string> = {
  research_market_price: "Researching market prices…",
  start_negotiation: "Creating negotiation…",
  draft_first_email: "Drafting email…",
  approve_and_dispatch: "Sending email…",
  get_negotiation_status: "Checking status…",
  show_pending_draft: "Fetching draft…",
  mark_negotiation_won: "Closing as won…",
  mark_negotiation_lost: "Closing as lost…",
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? `Using ${name}…`;
}

function getToolName(part: { type: string } & Record<string, unknown>): string {
  return "toolName" in part && typeof part.toolName === "string"
    ? part.toolName
    : part.type.replace("tool-", "");
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

  const toolParts = message.parts?.filter(isToolUIPart) ?? [];

  const pendingToolNames = toolParts
    .filter(
      (p) => p.state === "input-streaming" || p.state === "input-available",
    )
    .map(getToolName);

  const failedTools = toolParts
    .filter((p) => p.state === "output-error")
    .map((p) => ({
      name: getToolName(p),
      error: "errorText" in p && typeof p.errorText === "string" ? p.errorText : "",
    }));

  const emailDraftPart = toolParts.find(
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
    pendingToolNames.length > 0 ||
    failedTools.length > 0 ||
    emailDraft;
  if (!hasContent) return null;

  return (
    <div
      className={`flex flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}
    >
      {textParts || pendingToolNames.length > 0 ? (
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-foreground text-background"
              : "bg-muted text-foreground"
          }`}
        >
          {textParts ? (
            isUser ? (
              <p className="whitespace-pre-wrap">{textParts}</p>
            ) : (
              <Markdown className="space-y-2 [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-background/40 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-relaxed [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
                {textParts}
              </Markdown>
            )
          ) : null}
          {pendingToolNames.map((name, i) => (
            <p key={i} className="italic text-muted-foreground">
              {toolLabel(name)}
            </p>
          ))}
        </div>
      ) : null}

      {failedTools.map((t, i) => (
        <div
          key={i}
          className="flex max-w-[85%] items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-0.5 text-xs opacity-80">
              {t.error || `${toolLabel(t.name).replace("…", "")} failed.`}
            </p>
          </div>
        </div>
      ))}

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
