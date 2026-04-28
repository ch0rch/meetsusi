import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Session } from "./types";

export async function getSessionFromReq(
  req: NextRequest,
): Promise<Session | undefined> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return undefined;

  return {
    created: new Date(user.created_at).getTime(),
    user: {
      id: user.id,
      email: user.email,
      avatar: user.user_metadata?.["avatar_url"] ?? "",
      name: user.user_metadata?.["full_name"] ?? user.email ?? "",
    },
  };
}
