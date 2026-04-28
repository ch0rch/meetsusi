import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth/config";
import type { Session } from "./types";

export const getServerSession = cache(
  async (): Promise<Session | undefined> => {
    const baSession = await auth.api.getSession({
      headers: await headers(),
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
  },
);
