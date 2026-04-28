import { tool, generateText } from "ai";
import { nanoid } from "nanoid";
import { z } from "zod";
import { start, resumeHook } from "workflow/api";
import { gateway } from "@open-agents/agent";
import {
  createNegotiation,
  createEmail,
  getNegotiationByIdForUser,
  getEmailById,
  isFirstEmailOfNegotiation,
  updateEmail,
  updateNegotiation,
} from "@/lib/db/negotiations";
import { generateSusiEmail } from "@/lib/email/threading";
import { runNegotiation } from "@/lib/workflows/run-negotiation";

// ---------------------------------------------------------------------------
// Factory: creates tools bound to the current userId
// ---------------------------------------------------------------------------

export function createSusiTools(userId: string) {
  // ---------------------------------------------------------------------------
  // research_market_price
  // ---------------------------------------------------------------------------

  const research_market_price = tool({
    description:
      "Search the web to benchmark market prices for what the user wants to negotiate. Call this before drafting any email.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Search query to find comparable prices, e.g. 'Slack pricing 2024 SMB discount'",
        ),
      category: z
        .enum(["saas", "auto", "real_estate", "high_ticket", "other"])
        .describe("Category of the negotiation"),
    }),
    execute: async (input) => {
      const { query, category } = input;
      const tavilyKey = process.env.TAVILY_API_KEY;

      if (!tavilyKey) {
        const discountHints: Record<string, string> = {
          saas: "SaaS vendors typically offer 20-40% off when directly asked.",
          auto: "Auto dealers have 8-15% margin on most vehicles.",
          real_estate: "Rental negotiations of 5-10% are common.",
          high_ticket: "High-ticket items often have 10-20% flexibility.",
          other: "Most vendors have some flexibility — it's worth asking.",
        };
        return {
          findings:
            "Market research unavailable (no Tavily key). Proceeding with general knowledge.",
          industryInsight: discountHints[category] ?? discountHints.other,
          sources: [],
        };
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: "basic",
          max_results: 5,
          include_answer: true,
        }),
      });

      if (!response.ok) {
        return {
          findings:
            "Market research search failed. Continue with context from the user.",
          sources: [],
        };
      }

      const data = (await response.json()) as {
        answer?: string;
        results: { url: string; content: string }[];
      };

      const discountHints: Record<string, string> = {
        saas: "SaaS vendors typically offer 20-40% off list price when directly asked.",
        auto: "Auto dealers have 8-15% margin on most vehicles.",
        real_estate: "Rental negotiations of 5-10% are common in most markets.",
        high_ticket: "High-ticket items often have 10-20% flexibility.",
        other: "Most vendors have some flexibility — it's worth asking.",
      };

      return {
        findings: data.answer ?? "No summary available.",
        industryInsight: discountHints[category] ?? discountHints.other,
        sources: data.results.slice(0, 3).map((r) => r.url),
      };
    },
  });

  // ---------------------------------------------------------------------------
  // start_negotiation
  // ---------------------------------------------------------------------------

  const start_negotiation = tool({
    description:
      "Create a new negotiation record. Call this once all context is gathered from the user.",
    inputSchema: z.object({
      title: z
        .string()
        .describe("Short description of what's being negotiated"),
      category: z.enum(["saas", "auto", "real_estate", "high_ticket", "other"]),
      vendor_name: z.string().describe("Name of the vendor/company"),
      vendor_email: z
        .string()
        .email()
        .describe("Email address to negotiate with"),
      current_price: z.number().optional().describe("Current price being paid"),
      target_price: z.number().optional().describe("Desired target price"),
      currency: z.string().default("USD"),
      context: z
        .string()
        .optional()
        .describe("Additional context about the negotiation"),
    }),
    execute: async (input) => {
      const {
        title,
        category,
        vendor_name,
        vendor_email,
        current_price,
        target_price,
        currency,
        context,
      } = input;
      const id = nanoid();
      const susiEmail = generateSusiEmail(id);

      const negotiation = await createNegotiation({
        id,
        userId,
        title,
        category,
        vendorName: vendor_name,
        vendorEmail: vendor_email,
        currentPrice: current_price?.toString(),
        targetPrice: target_price?.toString(),
        currency,
        context,
        status: "researching",
        susiEmail,
      });

      return {
        negotiation_id: negotiation.id,
        susi_email: negotiation.susiEmail,
        message: `Negotiation created. Susi will use ${negotiation.susiEmail} to communicate with ${vendor_name}.`,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // draft_first_email
  // ---------------------------------------------------------------------------

  const draft_first_email = tool({
    description:
      "Generate the first email draft for a negotiation. Always present this to the user for approval before sending.",
    inputSchema: z.object({
      negotiation_id: z.string().describe("ID of the negotiation"),
    }),
    execute: async (input) => {
      const { negotiation_id } = input;
      const negotiation = await getNegotiationByIdForUser(
        negotiation_id,
        userId,
      );
      if (!negotiation) throw new Error("Negotiation not found");

      const { text } = await generateText({
        model: gateway("anthropic/claude-sonnet-4-6"),
        prompt: `Draft a professional, warm email to negotiate a better price.

Context:
- What we're negotiating: ${negotiation.title}
- Vendor: ${negotiation.vendorName}
- Current price: ${negotiation.currentPrice ? `${negotiation.currentPrice} ${negotiation.currency}` : "not specified"}
- Target price: ${negotiation.targetPrice ? `${negotiation.targetPrice} ${negotiation.currency}` : "not specified"}
- Additional context: ${negotiation.context ?? "none"}

Guidelines:
- Do NOT say you are negotiating or that you are an AI
- Do NOT ask for a discount directly
- Express genuine interest in continuing / closing
- Say you need to "make the numbers work"
- Ask if there's "any flexibility" on pricing before finalizing
- Keep it to 3-5 sentences
- Professional but warm tone

Write ONLY the email body (no subject line, no greeting header — just the body):`,
      });

      const subject = `${negotiation.title} — Account Review`;

      const email = await createEmail({
        negotiationId: negotiation.id,
        direction: "outbound",
        fromEmail: negotiation.susiEmail,
        toEmail: negotiation.vendorEmail ?? "",
        subject,
        body: text,
        status: "pending_approval",
      });

      await updateNegotiation(negotiation.id, { status: "awaiting_approval" });

      return {
        email_id: email.id,
        subject,
        body: text,
        to: negotiation.vendorEmail,
        from: negotiation.susiEmail,
        message:
          "Here's the draft email. Review it carefully — once you approve, Susi will send it and track the negotiation.",
      };
    },
  });

  // ---------------------------------------------------------------------------
  // approve_and_dispatch
  // ---------------------------------------------------------------------------

  const approve_and_dispatch = tool({
    description:
      "Mark a drafted email as approved and dispatch it. If it is the first email, starts the durable negotiation workflow. ONLY call this after the user explicitly approves the draft.",
    inputSchema: z.object({
      email_id: z
        .string()
        .describe("ID of the email draft to approve and send"),
    }),
    execute: async (input) => {
      const { email_id } = input;
      const email = await getEmailById(email_id);
      if (!email) throw new Error("Email not found");

      const negotiation = await getNegotiationByIdForUser(
        email.negotiationId,
        userId,
      );
      if (!negotiation) throw new Error("Unauthorized");

      if (email.status !== "pending_approval") {
        throw new Error(
          `Email is in status "${email.status}" — cannot approve`,
        );
      }

      await updateEmail(email_id, {
        approvedByUserAt: new Date(),
        status: "approved",
      });

      const isFirst = await isFirstEmailOfNegotiation(email.negotiationId);

      if (isFirst) {
        const run = await start(runNegotiation, [
          {
            negotiationId: email.negotiationId,
            firstEmailId: email_id,
          },
        ]);

        await updateNegotiation(email.negotiationId, {
          workflowRunId: run.runId,
          workflowStatus: "running",
          status: "negotiating",
        });

        return {
          status: "workflow_started",
          run_id: run.runId,
          message:
            "Email approved and dispatched. Susi is now running the negotiation. You'll be notified when there's news.",
        };
      }

      // Workflow already running — resume via hook
      await resumeHook(`user_approved:${email_id}`, { approved: true });

      return {
        status: "signal_sent",
        message:
          "Counter-offer approved. Susi will send it and continue the negotiation.",
      };
    },
  });

  // ---------------------------------------------------------------------------
  // get_negotiation_status
  // ---------------------------------------------------------------------------

  const get_negotiation_status = tool({
    description: "Check the current status of a negotiation.",
    inputSchema: z.object({
      negotiation_id: z.string().describe("ID of the negotiation"),
    }),
    execute: async (input) => {
      const { negotiation_id } = input;
      const negotiation = await getNegotiationByIdForUser(
        negotiation_id,
        userId,
      );
      if (!negotiation) throw new Error("Negotiation not found");

      const savings =
        negotiation.currentPrice && negotiation.finalPrice
          ? parseFloat(negotiation.currentPrice) -
            parseFloat(negotiation.finalPrice)
          : null;

      return {
        id: negotiation.id,
        title: negotiation.title,
        vendor: negotiation.vendorName,
        status: negotiation.status,
        current_price: negotiation.currentPrice,
        target_price: negotiation.targetPrice,
        final_price: negotiation.finalPrice,
        savings: savings?.toFixed(2),
        rounds_completed: negotiation.roundsCompleted,
        workflow_status: negotiation.workflowStatus,
      };
    },
  });

  return {
    research_market_price,
    start_negotiation,
    draft_first_email,
    approve_and_dispatch,
    get_negotiation_status,
  };
}
