import { getServerSession } from "@/lib/session/get-server-session";
import { listNegotiationsForUser } from "@/lib/db/negotiations";

export async function GET(): Promise<Response> {
  const session = await getServerSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const negotiations = await listNegotiationsForUser(session.user.id);
  return Response.json(negotiations);
}
