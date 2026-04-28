import { db } from "@/lib/db/client";
import { negotiations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
    .where(eq(negotiations.id, negotiationId));
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
    .where(eq(negotiations.id, negotiationId));

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
    .where(eq(negotiations.id, negotiationId));

  console.log(`Negotiation ${negotiationId} cancelled: ${reason}`);
}
