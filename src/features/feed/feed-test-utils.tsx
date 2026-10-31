import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/lib/store/store";

export function createRawPost(id: string | number, text = "Post caption") {
  return {
    id, text, image: "https://example.com/image.jpg",
    created_at: "2026-10-22T12:00:00.000Z",
    author: { id: "user-1", name: "User One", username: "userone" },
    likes_count: 3, comments_count: 1, likedByMe: true, is_saved: false,
  };
}

export function createFeedTestContext() {
  const store = makeStore();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    );
  }
  return { store, queryClient, wrapper };
}
