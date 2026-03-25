"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  createComment,
  deleteComment,
  deletePost,
  fetchPost,
  fetchPostComments,
  fetchPostLikes,
  likePost,
  savePost,
  unlikePost,
  unsavePost,
} from "@/lib/social-api";
import { buildLoginHref, getToken } from "@/lib/session";
import { useSessionSnapshot } from "@/lib/use-session";
import type { CommentItem, CommentListData, UserSummary } from "@/types/social";
import { EmptyState } from "@/components/empty-state";
import { UserChip } from "@/components/user-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatRelativeTime, getNextPageParam } from "@/lib/utils";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

type PendingState = {
  liked?: boolean;
  saved?: boolean;
  likeCount?: number;
};

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = String(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState("");
  const [likesOpen, setLikesOpen] = useState(false);
  const [pendingState, setPendingState] = useState<PendingState | null>(null);
  const session = useSessionSnapshot();

  const isLoggedIn = session.isLoggedIn;

  // ✅ Hanya fetch post — likedByMe & savedByMe sudah ada di response
  const postQuery = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
  });

  const commentsQuery = useInfiniteQuery({
    queryKey: ["post-comments", postId],
    queryFn: ({ pageParam }) =>
      fetchPostComments(postId, { page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
  });

  const likesQuery = useInfiniteQuery({
    queryKey: ["post-likes", postId],
    queryFn: ({ pageParam }) =>
      fetchPostLikes(Number(postId), { page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
    enabled: likesOpen,
  });

  const comments =
    commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [];
  const likedUsers = likesQuery.data?.pages.flatMap((page) => page.users) ?? [];

  // ✅ Baca langsung dari postQuery.data — tidak perlu fetch list terpisah
  const liked = pendingState?.liked ?? postQuery.data?.likedByMe ?? false;
  const saved = pendingState?.saved ?? postQuery.data?.savedByMe ?? false;
  const likeCount = pendingState?.likeCount ?? postQuery.data?.likeCount ?? 0;

  // ✅ Invalidate hanya query yang relevan
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!postQuery.data) return null;
      return liked
        ? unlikePost(postQuery.data.id)
        : likePost(postQuery.data.id);
    },
    onMutate: () => {
      const nextLiked = !liked;
      setPendingState((current) => ({
        ...current,
        liked: nextLiked,
        likeCount: likeCount + (nextLiked ? 1 : -1),
      }));
    },
    onError: () => {
      setPendingState(null);
    },
    onSuccess: (data) => {
      if (!data) return;
      setPendingState((current) => ({
        ...current,
        liked: data.liked,
        likeCount: data.likeCount,
      }));
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post-likes", postId] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!postQuery.data) return null;
      return saved
        ? unsavePost(postQuery.data.id)
        : savePost(postQuery.data.id);
    },
    onMutate: () => {
      setPendingState((current) => ({ ...current, saved: !saved }));
    },
    onError: () => {
      setPendingState(null);
    },
    onSuccess: (data) => {
      if (!data) return;
      setPendingState((current) => ({ ...current, saved: data.saved }));
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["me-saved"] });
    },
  });

  function handleProtectedAction(action: () => void) {
    if (!getToken()) {
      router.push(buildLoginHref(`/posts/${postId}`));
      return;
    }
    action();
  }

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!getToken()) {
        router.push(buildLoginHref(`/posts/${postId}`));
        return null;
      }
      if (!commentDraft.trim()) throw new Error("Komentar wajib diisi");
      return createComment(postId, commentDraft.trim());
    },
    onMutate: async () => {
      const previous = queryClient.getQueryData<InfiniteData<CommentListData>>([
        "post-comments",
        postId,
      ]);

      const optimisticText = commentDraft.trim();
      const optimisticComment: CommentItem = {
        id: -Date.now(),
        text: optimisticText,
        createdAt: new Date().toISOString(),
        author: {
          id: 0,
          username: session.username || "me",
          name: session.displayName,
          avatarUrl: session.avatarUrl || DEFAULT_AVATAR,
          isMe: true,
        },
        isMine: true,
      };

      setCommentDraft("");
      setCommentError("");

      queryClient.setQueryData<InfiniteData<CommentListData>>(
        ["post-comments", postId],
        (old) => {
          if (!old) {
            return {
              pageParams: [1],
              pages: [
                {
                  comments: [optimisticComment],
                  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
                },
              ],
            };
          }
          const [firstPage, ...restPages] = old.pages;
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                comments: [optimisticComment, ...firstPage.comments],
                pagination: {
                  ...firstPage.pagination,
                  total: firstPage.pagination.total + 1,
                },
              },
              ...restPages,
            ],
          };
        },
      );

      return { previous, optimisticText };
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["post-comments", postId], context.previous);
      }
      setCommentDraft(context?.optimisticText || "");
      setCommentError(
        error instanceof Error ? error.message : "Gagal mengirim komentar",
      );
    },
    onSuccess: () => {
      // ✅ Hanya invalidate comments + post (untuk update commentCount)
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => deleteComment(commentId),
    onMutate: async (commentId: number) => {
      const previous = queryClient.getQueryData<InfiniteData<CommentListData>>([
        "post-comments",
        postId,
      ]);

      queryClient.setQueryData<InfiniteData<CommentListData>>(
        ["post-comments", postId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              comments: page.comments.filter((item) => item.id !== commentId),
              pagination: {
                ...page.pagination,
                total: Math.max(page.pagination.total - 1, 0),
              },
            })),
          };
        },
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["post-comments", postId], context.previous);
      }
    },
    onSuccess: () => {
      // ✅ Hanya invalidate comments + post (untuk update commentCount)
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => deletePost(postId),
    onSuccess: () => {
      // ✅ Invalidate feed + profile posts setelah hapus
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile-posts"] });
      router.push("/feed");
    },
  });

  if (postQuery.isPending) {
    return <div className="p-6 text-white">Loading post...</div>;
  }

  if (postQuery.error || !postQuery.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="Post tidak tersedia"
          description="Bisa jadi post sudah dihapus atau ID post tidak valid."
          ctaLabel="Kembali ke Feed"
          ctaHref="/feed"
        />
      </div>
    );
  }

  const post = postQuery.data;
  const canDeletePost = post.author.username === session.username;

  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1220px] justify-end pb-4">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
                return;
              }
              router.push(session.isLoggedIn ? "/feed" : "/");
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#050b16]/92 text-white transition hover:bg-white/[0.05]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto grid max-w-[1220px] overflow-hidden rounded-[28px] border border-white/10 bg-[#040a16]/94 shadow-[0_24px_80px_rgba(0,0,0,0.48)] lg:grid-cols-[1.55fr_1fr]">
          <div className="bg-black">
            <img
              src={post.imageUrl || DEFAULT_AVATAR}
              alt={post.caption || "Post image"}
              className="h-full min-h-[320px] w-full object-cover lg:min-h-[720px]"
            />
          </div>

          <div className="flex min-h-[520px] flex-col border-l border-white/10">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Link href={`/profile/${post.author.username}`}>
                  <img
                    src={post.author.avatarUrl || DEFAULT_AVATAR}
                    alt={post.author.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {post.author.name}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {formatRelativeTime(post.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canDeletePost ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Hapus post ini?")) {
                        deletePostMutation.mutate();
                      }
                    }}
                    disabled={deletePostMutation.isPending}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                    aria-label="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60"
                  aria-label="More"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Caption */}
            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
              <p className="text-sm leading-8 text-white/82">
                {post.caption || "No caption yet."}
              </p>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Comments</h2>
                  <p className="mt-1 text-xs text-white/45">
                    {commentsQuery.isPending
                      ? "Memuat komentar..."
                      : `${comments.length} komentar`}
                  </p>
                </div>
                {commentsQuery.hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => commentsQuery.fetchNextPage()}
                    disabled={commentsQuery.isFetchingNextPage}
                    className="text-xs font-medium text-violet-400 transition hover:text-violet-300 disabled:opacity-50"
                  >
                    {commentsQuery.isFetchingNextPage
                      ? "Memuat..."
                      : "Load more"}
                  </button>
                ) : null}
              </div>

              {!comments.length ? (
                <p className="text-sm text-white/55">Belum ada komentar.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((item) => (
                    <div
                      key={item.id}
                      className="border-b border-white/8 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <img
                            src={item.author.avatarUrl || DEFAULT_AVATAR}
                            alt={item.author.name}
                            className="mt-0.5 h-9 w-9 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {item.author.name}
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                              {formatRelativeTime(item.createdAt)}
                            </p>
                            <p className="mt-3 text-sm leading-7 text-white/78">
                              {item.text}
                            </p>
                          </div>
                        </div>

                        {item.isMine ? (
                          <button
                            type="button"
                            onClick={() =>
                              deleteCommentMutation.mutate(item.id)
                            }
                            disabled={deleteCommentMutation.isPending}
                            className="text-xs font-medium text-white/55 transition hover:text-white disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions + Comment Composer */}
            <div className="border-t border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-5 text-sm">
                  <button
                    type="button"
                    onClick={() =>
                      handleProtectedAction(() => likeMutation.mutate())
                    }
                    disabled={likeMutation.isPending}
                    className="inline-flex items-center gap-2 transition hover:text-[#ff4d93] disabled:opacity-50"
                  >
                    <Heart
                      className={`h-5 w-5 ${liked ? "fill-[#ff4d93] text-[#ff4d93]" : "text-[#ff4d93]"}`}
                    />
                    <span>{likeCount}</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.commentCount}</span>
                  </button>

                  {/* ✅ Send icon tanpa count (fitur disabled) */}
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 opacity-45"
                    aria-label="Share (coming soon)"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleProtectedAction(() => saveMutation.mutate())
                  }
                  disabled={saveMutation.isPending}
                  className="transition hover:text-white/80 disabled:opacity-50"
                  aria-label={saved ? "Unsave post" : "Save post"}
                >
                  <Bookmark
                    className={`h-5 w-5 ${saved ? "fill-current" : ""}`}
                  />
                </button>
              </div>

              {/* Comment input */}
              <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-white/10 bg-[#050b16] px-3 py-2">
                <Smile className="h-5 w-5 shrink-0 text-white/55" />
                {isLoggedIn ? (
                  <>
                    <Input
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          commentDraft.trim()
                        ) {
                          event.preventDefault();
                          createCommentMutation.mutate();
                        }
                      }}
                      placeholder="Add Comment"
                      className="h-10 border-0 bg-transparent px-0 text-white shadow-none placeholder:text-white/28 focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => createCommentMutation.mutate()}
                      disabled={
                        createCommentMutation.isPending || !commentDraft.trim()
                      }
                      className="shrink-0 text-sm font-semibold text-white/45 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {createCommentMutation.isPending ? "Posting..." : "Post"}
                    </button>
                  </>
                ) : (
                  <div className="flex w-full items-center justify-between gap-3">
                    <p className="text-sm text-white/50">
                      Login untuk menulis komentar
                    </p>
                    <Link
                      href={buildLoginHref(`/posts/${postId}`)}
                      className="text-sm font-semibold text-violet-400"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>

              {commentError ? (
                <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {commentError}
                </div>
              ) : null}

              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-white/42">
                <button
                  type="button"
                  onClick={() => setLikesOpen(true)}
                  className="transition hover:text-white/70"
                >
                  Lihat siapa yang like
                </button>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1220px] justify-start pt-4">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-white/10 bg-[#050b16] px-5 text-white"
          >
            <Link href={session.isLoggedIn ? "/feed" : "/"}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Liked by modal */}
      {likesOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-[#060915] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-lg font-semibold text-white">Liked by</p>
                <p className="text-sm text-white/45">
                  Lihat siapa saja yang sudah memberi like pada post ini.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLikesOpen(false)}
                className="rounded-full text-white/60 hover:bg-white/5 hover:text-white"
              >
                Close
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {!likedUsers.length && likesQuery.isPending ? (
                <p className="text-center text-white/65">Memuat likes...</p>
              ) : !likedUsers.length ? (
                <EmptyState
                  title="Belum ada likes"
                  description="Saat user mulai memberi like, daftarnya akan muncul di sini."
                />
              ) : (
                <div className="space-y-4">
                  {likedUsers.map((user: UserSummary) => (
                    <UserChip key={`${user.id}-${user.username}`} user={user} />
                  ))}
                </div>
              )}
            </div>

            {likesQuery.hasNextPage ? (
              <div className="border-t border-white/10 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => likesQuery.fetchNextPage()}
                  disabled={likesQuery.isFetchingNextPage}
                  className="h-11 w-full rounded-full"
                >
                  {likesQuery.isFetchingNextPage ? "Memuat..." : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
