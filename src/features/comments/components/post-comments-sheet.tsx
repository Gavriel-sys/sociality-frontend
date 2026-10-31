"use client";

import { Sheet } from "@/components/ui/sheet";
import { CommentPostDialogs, useCommentPostDialogs } from "./comment-post-dialogs";
import { CommentPostFooter } from "./comment-post-footer";
import { CommentStream } from "./comment-stream";
import type { PostCommentsModalProps } from "./post-comments-modal";

export type PostCommentsSheetProps = PostCommentsModalProps;

export function PostCommentsSheet({ post, isOpen, onClose, isSubmitting, onSubmitComment, ...stream }: Readonly<PostCommentsSheetProps>) {
  const dialogs = useCommentPostDialogs(onClose);
  return (
    <Sheet isOpen={isOpen} onClose={dialogs.closeComments} title="Comments"
      className="flex max-h-[85dvh] flex-col overflow-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>h2]:text-base [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#1F242F_transparent]">
        <CommentStream postId={post.id} {...stream} />
      </div>
      <CommentPostFooter post={post} isSubmitting={isSubmitting} onSubmitComment={onSubmitComment} onViewLikes={dialogs.openLikes} onShare={dialogs.openOptions} />
      <CommentPostDialogs post={post} activeDialog={dialogs.activeDialog} onClose={dialogs.closePostDialog} onDeleted={onClose} />
    </Sheet>
  );
}
