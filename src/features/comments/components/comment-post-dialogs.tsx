"use client";

import { useCallback, useRef, useState } from "react";
import { PostLikesDialog } from "@/features/posts/components/post-likes-dialog";
import { PostOptionsDialog } from "@/features/posts/components/post-options-dialog";
import type { Post } from "@/features/posts/types";
import { usePostLikes } from "@/features/posts/use-post-likes";

type PostDialog = "options" | "likes";

interface CommentPostDialogControls {
  readonly activeDialog?: PostDialog;
  readonly openOptions: () => void;
  readonly openLikes: () => void;
  readonly closePostDialog: () => void;
  readonly closeComments: () => void;
}

export function useCommentPostDialogs(onClose: () => void): CommentPostDialogControls {
  const [activeDialog, setActiveDialog] = useState<PostDialog>();
  const activeDialogRef = useRef<PostDialog>(undefined);
  const openDialog = (dialog?: PostDialog) => {
    activeDialogRef.current = dialog;
    setActiveDialog(dialog);
  };
  const closeComments = useCallback(() => {
    if (!activeDialogRef.current) onClose();
  }, [onClose]);
  return {
    activeDialog,
    openOptions: () => openDialog("options"),
    openLikes: () => openDialog("likes"),
    closePostDialog: () => openDialog(),
    closeComments,
  };
}

interface CommentPostDialogsProps {
  readonly post: Post;
  readonly activeDialog?: PostDialog;
  readonly onClose: () => void;
  readonly onDeleted: () => void;
}

export function CommentPostDialogs({ post, activeDialog, onClose, onDeleted }: Readonly<CommentPostDialogsProps>) {
  const likes = usePostLikes(post.id, activeDialog === "likes");
  return (
    <>
      <PostOptionsDialog post={post} isOpen={activeDialog === "options"} onClose={onClose} onDeleted={onDeleted} />
      <PostLikesDialog isOpen={activeDialog === "likes"} onClose={onClose} users={likes.users} isLoading={likes.isLoading} isError={likes.isError} onRetry={() => void likes.refetch()} />
    </>
  );
}
