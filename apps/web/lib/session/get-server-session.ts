import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Session } from "./types";

export const getServerSession = cache(
  async (): Promise<Session | undefined> => {
    const supabase = await createSupabaseServerClient();
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
  },
);
