"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link
            href="/negotiations"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="font-medium">New negotiation</p>
        </div>
      </header>

      <SusiChat
        initialMessages={[GREETING]}
        placeholder="Tell Susi what to negotiate…"
        onNegotiationCreated={(id) => router.push(`/negotiations/${id}`)}
      />
    </div>
  );
}
