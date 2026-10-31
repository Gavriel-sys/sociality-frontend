import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { setSession } from "@/features/auth/auth-slice";
import { normalizePost } from "@/features/posts/types";
import { makeStore } from "@/lib/store/store";

export const post = normalizePost({
  id: 42, caption: "Backend post", imageUrl: "/post.jpg", createdAt: "2026-10-28T10:00:00Z",
  author: { id: 1, name: "Alex", username: "alex" }, likeCount: 8, commentCount: 3,
});

export function createInteractionTestContext() {
  const store = makeStore();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  store.dispatch(setSession({ token: "test-jwt", sessionId: "session-alex", user: post.author }));
  function Wrapper({ children }: { readonly children: ReactNode }) {
    return <Provider store={store}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></Provider>;
  }
  return { store, queryClient, wrapper: Wrapper };
}

export function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
}
