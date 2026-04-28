"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

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

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    authClient.getSession().then((result) => {
      if (result.data?.user) {
        const user = result.data.user;
        setState({
          session: {
            user: {
              id: user.id,
              email: user.email ?? undefined,
              name: user.name ?? "",
              avatar: user.image ?? "",
            },
          },
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setState({ session: null, loading: false, isAuthenticated: false });
      }
    });
  }, []);

  return state;
}
