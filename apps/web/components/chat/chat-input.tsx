"use client";

import { Send } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  textareaRef,
}: ChatInputProps) {
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="shrink-0 border-t border-border px-6 py-4">
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-[8px] border border-border bg-muted px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/50"
          style={{ maxHeight: 120 }}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
