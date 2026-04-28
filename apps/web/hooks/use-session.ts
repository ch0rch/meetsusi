"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface SessionUser {
  id: string;
  email: string | undefined;
  name: string;
  avatar: string;
}

interface SessionState {
  session: { user: SessionUser } | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const supabase = createSupabaseBrowserClient();

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setState({
          session: {
            user: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.["full_name"] ?? user.email ?? "",
              avatar: user.user_metadata?.["avatar_url"] ?? "",
            },
          },
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setState({ session: null, loading: false, isAuthenticated: false });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (user) {
        setState({
          session: {
            user: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.["full_name"] ?? user.email ?? "",
              avatar: user.user_metadata?.["avatar_url"] ?? "",
            },
          },
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setState({ session: null, loading: false, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
