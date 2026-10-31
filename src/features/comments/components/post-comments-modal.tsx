"use client";

import { useId } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ImageIcon } from "@/components/ui/icons";
import type { Post } from "@/features/posts/types";
import { CommentPostDialogs, useCommentPostDialogs } from "./comment-post-dialogs";
import { CommentPostFooter } from "./comment-post-footer";
import { CommentPostHeader } from "./comment-post-header";
import { CommentStream, type CommentStreamProps } from "./comment-stream";

export interface PostCommentsModalProps extends Omit<CommentStreamProps, "postId"> {
  readonly post: Post;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isSubmitting?: boolean;
  readonly onSubmitComment: (content: string) => Promise<void> | void;
}

export function PostCommentsModal({ post, isOpen, onClose, isSubmitting, onSubmitComment, ...stream }: Readonly<PostCommentsModalProps>) {
  const headingId = useId();
  const dialogs = useCommentPostDialogs(onClose);
  return (
    <Dialog isOpen={isOpen} onClose={dialogs.closeComments} aria-labelledby={headingId}
      overlayClassName="py-16 md:px-12"
      className="max-w-[1200px] rounded-none border-0 p-0 [&>[data-slot=dialog-content]]:mt-0 [&>[data-slot=dialog-close]]:-top-12 [&>[data-slot=dialog-close]]:right-0 [&>[data-slot=dialog-close]]:text-[#FDFDFD]"
    >
      <div className="flex h-[min(720px,calc(100dvh-128px))] min-h-0">
        <CommentPostImage post={post} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0A0D12] p-4 md:p-5">
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#1F242F_transparent]">
            <CommentPostHeader post={post} onOptions={dialogs.openOptions} />
            <section aria-labelledby={headingId} className="pt-5">
              <h2 id={headingId} className="mb-1 text-base font-bold text-[#FDFDFD]">Comments</h2>
              <CommentStream postId={post.id} {...stream} />
            </section>
          </div>
          <CommentPostFooter post={post} isSubmitting={isSubmitting} onSubmitComment={onSubmitComment} onViewLikes={dialogs.openLikes} onShare={dialogs.openOptions} />
        </div>
      </div>
      <CommentPostDialogs post={post} activeDialog={dialogs.activeDialog} onClose={dialogs.closePostDialog} onDeleted={onClose} />
    </Dialog>
  );
}

function CommentPostImage({ post }: Readonly<{ post: Post }>) {
  return (
    <div className="relative hidden h-full w-3/5 shrink-0 items-center justify-center overflow-hidden bg-black md:flex">
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt={post.caption ? `Post image: ${post.caption.slice(0, 50)}` : "Post image"} className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-[#A4A7AE]">
          <ImageIcon className="h-12 w-12 opacity-50" /><span className="text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
}
