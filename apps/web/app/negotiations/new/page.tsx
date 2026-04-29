"use client";

import { useRouter } from "next/navigation";
import type { UIMessage } from "ai";
import { SusiChat } from "@/components/susi-chat";

const GREETING: UIMessage = {
  id: "susi-greeting",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hi! I'm Susi, your personal negotiation agent.\n\nTell me what you'd like to negotiate — SaaS pricing, car deals, rent, subscriptions — and I'll handle the back-and-forth for you.\n\nWhat would you like to negotiate today?",
    },
  ],
};

export default function NewNegotiationPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-6 py-4">
        <p className="font-medium text-black dark:text-white">
          New negotiation
        </p>
        <p className="mt-0.5 text-xs text-black/50 dark:text-white/45">
          Tell Susi what you want to negotiate
        </p>
      </div>

      <SusiChat
        initialMessages={[GREETING]}
        placeholder="Tell Susi what to negotiate…"
        onNegotiationCreated={(id) => router.push(`/negotiations/${id}`)}
      />
    </div>
  );
}
