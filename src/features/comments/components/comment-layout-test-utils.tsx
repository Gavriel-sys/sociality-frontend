import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { setSession } from "@/features/auth/auth-slice";
import type { Post } from "@/features/posts/types";
import { makeStore } from "@/lib/store/store";
import type { Comment } from "../types";

export const layoutPost: Post = {
  id: "layout-post", caption: "A day with friends", imageUrl: "/images/post.jpg",
  createdAt: "2026-10-24T12:00:00Z",
  author: { id: "author", username: "johndoe", name: "John Doe" },
  likesCount: 20, commentsCount: 1, isLiked: false, isSaved: false,
};

export const layoutComment: Comment = {
  id: "layout-comment", content: "Really good photo", createdAt: "2026-10-24T12:01:00Z",
  author: { id: "commenter", username: "alexander", name: "Alexander" },
};

export function renderCommentLayout(ui: ReactNode) {
  const store = makeStore();
  store.dispatch(setSession({ token: "test-token", sessionId: "layout-session", user: { id: "author", username: "johndoe" } }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["posts", layoutPost.id], layoutPost);
  return render(<Provider store={store}><QueryClientProvider client={client}>{ui}</QueryClientProvider></Provider>);
}
