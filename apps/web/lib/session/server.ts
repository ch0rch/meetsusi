import type { NextRequest } from "next/server";
import type { Session } from "./types";
import { auth } from "@/lib/auth/config";

export async function getSessionFromReq(
  req: NextRequest,
): Promise<Session | undefined> {
  const baSession = await auth.api.getSession({
    headers: req.headers,
  });

  if (!baSession?.user) {
    return undefined;
  }

  return {
    created: baSession.session.createdAt.getTime(),
    user: {
      id: baSession.user.id,
      email: baSession.user.email ?? undefined,
      avatar: baSession.user.image ?? "",
      name: baSession.user.name ?? "",
    },
  };
}
