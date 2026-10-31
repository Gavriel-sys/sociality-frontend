"use client";

import { useContext, useMemo, useSyncExternalStore } from "react";
import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import { ReactReduxContext } from "react-redux";
import type { AuthState } from "@/features/auth/types";

interface PostSession {
  readonly token?: string;
  readonly sessionId?: string;
}

export function usePostSession(): PostSession {
  const reduxContext = useContext(ReactReduxContext);
  const auth = useSyncExternalStore(
    (notify) => reduxContext?.store.subscribe(notify) ?? (() => {}),
    () => (reduxContext?.store.getState() as { auth?: AuthState } | undefined)?.auth,
    () => undefined,
  );
  return { token: auth?.token ?? undefined, sessionId: auth?.sessionId ?? undefined };
}

export function usePostQueryClient(): QueryClient {
  const queryClient = useContext(QueryClientContext);
  const fallbackClient = useMemo(() => new QueryClient(), []);
  return queryClient ?? fallbackClient;
}
