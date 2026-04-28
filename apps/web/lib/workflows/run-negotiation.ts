import { createHook, FatalError } from "workflow";
import { sendApprovedEmailStep } from "./steps/send-email";
import { classifyReplyStep } from "./steps/classify-reply";
import { draftCounterOfferStep } from "./steps/draft-counter";
import { markWonStep, markLostStep, markCancelledStep } from "./steps/state";

const MAX_ROUNDS = 8;

export async function runNegotiation(input: {
  negotiationId: string;
  firstEmailId: string;
}): Promise<{ status: string; price?: string }> {
  "use workflow";

  if (!input.negotiationId || !input.firstEmailId) {
    throw new FatalError("negotiationId and firstEmailId are required");
  }

  // Step 1: Send the approved first email
  await sendApprovedEmailStep(input.firstEmailId);

  // Create a persistent hook for vendor replies.
  // External code uses resumeHook(`vendor_replied:${negotiationId}`, {emailId}) to wake this up.
  using vendorReplyHook = createHook<{ emailId: string }>({
    token: `vendor_replied:${input.negotiationId}`,
  });

  let round = 0;

  for await (const reply of vendorReplyHook) {
    if (round >= MAX_ROUNDS) {
      await markLostStep(input.negotiationId, "max rounds reached");
      break;
    }

    // Classify the vendor reply with LLM
    const classification = await classifyReplyStep(reply.emailId);

    if (classification.kind === "hard_no") {
      await markLostStep(input.negotiationId, "vendor refused");
      break;
    }

    if (classification.kind === "deal_accepted") {
      await markWonStep(input.negotiationId, classification.acceptedPrice);
      return { status: "won", price: classification.acceptedPrice };
    }

    // Draft a counter-offer
    const draftId = await draftCounterOfferStep({
      negotiationId: input.negotiationId,
      vendorEmailId: reply.emailId,
      classification,
    });

    // Wait for user approval — one-time hook per draft
    using approvalHook = createHook<{ approved: boolean }>({
      token: `user_approved:${draftId}`,
    });

    const approvalResult = await approvalHook;

    if (!approvalResult.approved) {
      await markCancelledStep(
        input.negotiationId,
        "user declined counter-offer",
      );
      break;
    }

    await sendApprovedEmailStep(draftId);
    round++;
  }

  return { status: "completed" };
}
