"use client";

import { useContext, useState, useSyncExternalStore } from "react";
import { ReactReduxContext } from "react-redux";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { AuthUser } from "@/features/auth/types";
import type { Post } from "@/features/posts/types";
import { useDeletePost } from "@/features/posts/use-delete-post";

export interface PostOptionsDialogProps {
  readonly post: Post;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onDeleted?: () => void;
}

function useAuthUser(): AuthUser | undefined {
  const reduxContext = useContext(ReactReduxContext);
  return useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { user?: AuthUser | null } })?.auth?.user : undefined),
    () => undefined,
  ) ?? undefined;
}

export function PostOptionsDialog({ post, isOpen, onClose, onDeleted }: Readonly<PostOptionsDialogProps>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const authUser = useAuthUser();
  const { deletePost, isLoading } = useDeletePost(post.id);

  const isOwner = Boolean(
    authUser?.username &&
    post.author?.username &&
    authUser.username.toLowerCase() === post.author.username.toLowerCase(),
  );

  const handleClose = () => {
    setIsConfirming(false);
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`/posts/${post.id}`);
      }
    } catch {
      // clipboard write fallback
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = async () => {
    const success = await deletePost();
    if (success) {
      handleClose();
      onDeleted?.();
    }
  };

  const optionBtnClass = "w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B41759]";

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={isConfirming ? "Delete post" : "Post options"}>
      {isConfirming ? (
        <div className="space-y-4 pt-2">
          <p className="text-sm text-[#A4A7AE] text-center">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setIsConfirming(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#1F242F]/60">
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className={`${optionBtnClass} text-[#B41759] font-semibold hover:bg-[#B41759]/10`}
            >
              Delete post
            </button>
          )}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`${optionBtnClass} text-[#FDFDFD] hover:bg-[#141820]`}
          >
            {isCopied ? "Copied!" : "Copy link to post"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className={`${optionBtnClass} text-[#A4A7AE] hover:bg-[#141820] hover:text-[#FDFDFD]`}
          >
            Cancel
          </button>
        </div>
      )}
    </Dialog>
  );
}
