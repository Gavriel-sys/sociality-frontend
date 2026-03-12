"use client";

import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createComment,
  deleteComment,
  deletePost,
  fetchMyLikes,
  fetchMySaved,
  fetchPost,
  fetchPostComments,
  fetchPostLikes,
} from "@/lib/social-api";
import { buildLoginHref, getStoredAvatar, getStoredDisplayName, getStoredUsername, getToken } from "@/lib/session";
import type { CommentItem, CommentListData, UserSummary } from "@/types/social";
import { EmptyState } from "@/components/empty-state";
import { PageShell, Surface } from "@/components/page-shell";
import { PostCard } from "@/components/post-card";
import { UserChip } from "@/components/user-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, getNextPageParam } from "@/lib/utils";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = String(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState("");
  const [likesOpen, setLikesOpen] = useState(false);

  const isLoggedIn = !!getToken();
  const postQuery = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
  });

  const likedStateQuery = useQuery({
    queryKey: ["detail-liked-state", postId],
    queryFn: () => fetchMyLikes({ page: 1, limit: 100 }),
    enabled: isLoggedIn,
  });

  const savedStateQuery = useQuery({
    queryKey: ["detail-saved-state", postId],
    queryFn: () => fetchMySaved({ page: 1, limit: 100 }),
    enabled: isLoggedIn,
  });

  const commentsQuery = useInfiniteQuery({
    queryKey: ["post-comments", postId],
    queryFn: ({ pageParam }) => fetchPostComments(postId, { page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
  });

  const likesQuery = useInfiniteQuery({
    queryKey: ["post-likes", postId],
    queryFn: ({ pageParam }) => fetchPostLikes(Number(postId), { page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
    enabled: likesOpen,
  });

  const comments = commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [];
  const likeIds = new Set(likedStateQuery.data?.posts.map((post) => post.id) ?? []);
  const saveIds = new Set(savedStateQuery.data?.posts.map((post) => post.id) ?? []);
  const likedUsers = likesQuery.data?.pages.flatMap((page) => page.users) ?? [];

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!getToken()) {
        router.push(buildLoginHref(`/posts/${postId}`));
        return null;
      }

      if (!commentDraft.trim()) {
        throw new Error("Komentar wajib diisi");
      }

      return createComment(postId, commentDraft.trim());
    },
    onMutate: async () => {
      const previous = queryClient.getQueryData<InfiniteData<CommentListData>>(["post-comments", postId]);
      const optimisticText = commentDraft.trim();
      const optimisticComment: CommentItem = {
        id: -Date.now(),
        text: optimisticText,
        createdAt: new Date().toISOString(),
        author: {
          id: 0,
          username: getStoredUsername() || "me",
          name: getStoredDisplayName(),
          avatarUrl: getStoredAvatar() || DEFAULT_AVATAR,
          isMe: true,
        },
        isMine: true,
      };

      setCommentDraft("");
      setCommentError("");

      queryClient.setQueryData<InfiniteData<CommentListData>>(["post-comments", postId], (old) => {
        if (!old) {
          return {
            pageParams: [1],
            pages: [
              {
                comments: [optimisticComment],
                pagination: {
                  page: 1,
                  limit: 10,
                  total: 1,
                  totalPages: 1,
                },
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
      });

      return {
        previous,
        optimisticText,
      };
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["post-comments", postId], context.previous);
      }

      setCommentDraft(context?.optimisticText || "");
      setCommentError(error instanceof Error ? error.message : "Gagal mengirim komentar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({});
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => deleteComment(commentId),
    onMutate: async (commentId: number) => {
      const previous = queryClient.getQueryData<InfiniteData<CommentListData>>(["post-comments", postId]);

      queryClient.setQueryData<InfiniteData<CommentListData>>(["post-comments", postId], (old) => {
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
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["post-comments", postId], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({});
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({});
      router.push("/feed");
    },
  });

  const canDeletePost = postQuery.data?.author.username === getStoredUsername();
  const detailDescription = useMemo(() => {
    if (!postQuery.data) return "";
    return `Diposting ${formatDate(postQuery.data.createdAt)} oleh @${postQuery.data.author.username}.`;
  }, [postQuery.data]);

  if (postQuery.isPending) {
    return <div className="p-6 text-white">Loading post...</div>;
  }

  if (postQuery.error || !postQuery.data) {
    return (
      <PageShell eyebrow="Post detail" title="Post tidak ditemukan" description="Cek lagi URL post atau kembali ke feed untuk melanjutkan browsing.">
        <EmptyState title="Post tidak tersedia" description="Bisa jadi post sudah dihapus atau ID post tidak valid." ctaLabel="Kembali ke Feed" ctaHref="/feed" />
      </PageShell>
    );
  }

  return (
    <>
      <PageShell
        eyebrow="Post detail"
        title="Lihat post, suka, simpan, dan lanjutkan percakapan."
        description={detailDescription}
        actions={
          <Button asChild variant="outline" className="h-12 rounded-full px-6">
            <Link href={getToken() ? "/feed" : "/"}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <PostCard
              post={postQuery.data}
              forceLiked={likeIds.has(postQuery.data.id)}
              forceSaved={saveIds.has(postQuery.data.id)}
              showDetailAction={false}
              onOpenLikes={() => setLikesOpen(true)}
            />

            <Surface>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Komentar</h2>
                  <p className="mt-1 text-sm text-white/55">
                    {commentsQuery.isPending ? "Memuat komentar..." : `${comments.length} komentar tampil`}
                  </p>
                </div>

                {canDeletePost ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm("Hapus post ini?")) {
                        deletePostMutation.mutate();
                      }
                    }}
                    disabled={deletePostMutation.isPending}
                    className="h-11 rounded-full px-4"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus Post
                  </Button>
                ) : null}
              </div>

              {getToken() ? (
                <div className="mt-5 space-y-3">
                  <Input
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Tulis komentar kamu..."
                    className="h-12 rounded-full border-white/10 bg-[#050b16] text-white placeholder:text-white/35"
                  />
                  {commentError ? (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      {commentError}
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => createCommentMutation.mutate()}
                    disabled={createCommentMutation.isPending}
                    className="h-11 rounded-full px-5"
                  >
                    {createCommentMutation.isPending ? "Mengirim..." : "Kirim komentar"}
                  </Button>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/55">
                  Login dulu untuk ikut berkomentar pada post ini.
                  <div className="mt-3">
                    <Button asChild className="h-11 rounded-full px-5">
                      <Link href={buildLoginHref(`/posts/${postId}`)}>Login untuk komentar</Link>
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {!comments.length ? (
                  <p className="text-sm text-white/55">Belum ada komentar.</p>
                ) : (
                  comments.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{item.author.name}</p>
                          <p className="text-sm text-white/45">@{item.author.username} � {formatDate(item.createdAt)}</p>
                        </div>
                        {item.isMine ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => deleteCommentMutation.mutate(item.id)}
                            disabled={deleteCommentMutation.isPending}
                            className="h-9 rounded-full px-3 text-white/60 hover:bg-white/5 hover:text-white"
                          >
                            Hapus
                          </Button>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/72">{item.text}</p>
                    </div>
                  ))
                )}
              </div>

              {commentsQuery.hasNextPage ? (
                <div className="mt-5 flex justify-center">
                  <Button type="button" variant="outline" onClick={() => commentsQuery.fetchNextPage()} disabled={commentsQuery.isFetchingNextPage} className="h-11 rounded-full px-5">
                    {commentsQuery.isFetchingNextPage ? "Memuat..." : "Load more comments"}
                  </Button>
                </div>
              ) : null}
            </Surface>
          </div>

          <Surface className="h-fit">
            <h2 className="text-xl font-semibold text-white">Ringkasan post</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Buka daftar likes untuk melihat siapa saja yang berinteraksi, lalu gunakan komentar untuk melanjutkan diskusi dari context post yang sama.
            </p>
            <div className="mt-5 space-y-3 text-sm text-white/65">
              <p>Author: @{postQuery.data.author.username}</p>
              <p>Likes: {postQuery.data.likeCount}</p>
              <p>Comments: {postQuery.data.commentCount}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setLikesOpen(true)} className="mt-6 h-11 w-full rounded-full">
              Lihat siapa yang like
            </Button>
          </Surface>
        </div>
      </PageShell>

      {likesOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-[#060915] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-lg font-semibold text-white">Liked by</p>
                <p className="text-sm text-white/45">Lihat siapa saja yang sudah memberi like pada post ini.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setLikesOpen(false)} className="rounded-full text-white/60 hover:bg-white/5 hover:text-white">
                Close
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {!likedUsers.length && likesQuery.isPending ? (
                <p className="text-center text-white/65">Memuat likes...</p>
              ) : !likedUsers.length ? (
                <EmptyState title="Belum ada likes" description="Saat user mulai memberi like, daftarnya akan muncul di sini." />
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
                <Button type="button" variant="outline" onClick={() => likesQuery.fetchNextPage()} disabled={likesQuery.isFetchingNextPage} className="h-11 w-full rounded-full">
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
