import { db } from "@/lib/db/client";
import { negotiations } from "@/lib/db/schema";
import { and, eq, notInArray } from "drizzle-orm";

// A negotiation in any of these statuses is terminal — never overwrite.
// Why: prevents the workflow from clobbering a manual close (mark_negotiation_won/lost)
// when a queued vendor reply gets processed after the user already settled the deal.
const TERMINAL_STATUSES = ["won", "lost", "cancelled"] as const;

export async function markWonStep(
  negotiationId: string,
  acceptedPrice: string | undefined,
): Promise<void> {
  "use step";

  await db
    .update(negotiations)
    .set({
      status: "won",
      finalPrice: acceptedPrice ?? undefined,
      wonAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(negotiations.id, negotiationId),
        notInArray(negotiations.status, TERMINAL_STATUSES),
      ),
    );
}

export async function markLostStep(
  negotiationId: string,
  reason: string,
): Promise<void> {
  "use step";

  await db
    .update(negotiations)
    .set({
      status: "lost",
      lostAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(negotiations.id, negotiationId),
        notInArray(negotiations.status, TERMINAL_STATUSES),
      ),
    );

  console.log(`Negotiation ${negotiationId} lost: ${reason}`);
}

export async function markCancelledStep(
  negotiationId: string,
  reason: string,
): Promise<void> {
  "use step";

  await db
    .update(negotiations)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(negotiations.id, negotiationId),
        notInArray(negotiations.status, TERMINAL_STATUSES),
      ),
    );

  console.log(`Negotiation ${negotiationId} cancelled: ${reason}`);
}
