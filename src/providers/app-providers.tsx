"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { loadSession } from "@/features/auth/session-storage";
import { getQueryClient } from "@/lib/query/query-client";
import { useAppDispatch } from "@/lib/store/hooks";
import { makeStore, type AppStore } from "@/lib/store/store";

export interface AppProvidersProps {
  readonly children: ReactNode;
  readonly store?: AppStore;
  readonly queryClient?: QueryClient;
}

function SessionHydrator({ children }: { readonly children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const session = loadSession();
    if (session) {
      dispatch(setSession(session));
    } else {
      dispatch(clearSession());
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function AppProviders({
  children,
  store,
  queryClient,
}: AppProvidersProps) {
  const [defaultStore] = useState(() => makeStore());
  const activeStore = store !== undefined ? store : defaultStore;
  const resolvedQueryClient = queryClient !== undefined ? queryClient : getQueryClient();

  return (
    <Provider store={activeStore}>
      <QueryClientProvider client={resolvedQueryClient}>
        <SessionHydrator>{children}</SessionHydrator>
      </QueryClientProvider>
    </Provider>
  );
}
