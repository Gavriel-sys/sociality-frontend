"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Provider } from "react-redux";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query/query-client";
import { makeStore, type AppStore } from "@/lib/store/store";

export interface AppProvidersProps {
  readonly children: ReactNode;
  readonly store?: AppStore;
  readonly queryClient?: QueryClient;
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
        {children}
      </QueryClientProvider>
    </Provider>
  );
}
