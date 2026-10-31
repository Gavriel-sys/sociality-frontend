"use client";

import {
  BookmarkFilledIcon, BookmarkIcon, HeartFilledIcon, HeartIcon,
  MessageCircleIcon, ShareIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import styles from "./post-action-bar.module.css";

export interface PostActionBarProps {
  readonly isLiked: boolean;
  readonly likesCount: number;
  readonly commentsCount: number;
  readonly isSaved: boolean;
  readonly onLike: () => void;
  readonly onViewLikes?: () => void;
  readonly onSave: () => void;
  readonly onComment?: () => void;
  readonly onShare?: () => void;
  readonly className?: string;
}

const actionButtonClassName = cn(styles.action, "rounded-lg text-[#FDFDFD] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B41759]");
const iconClassName = "shrink-0";

function LikeAction({ isLiked, likesCount, onLike, onViewLikes }: Readonly<Pick<PostActionBarProps, "isLiked" | "likesCount" | "onLike" | "onViewLikes">>) {
  return (
    <div className={styles.likeGroup}>
      <button type="button" aria-label={isLiked ? "Unlike post" : "Like post"} aria-pressed={isLiked} onClick={onLike} className={cn(actionButtonClassName, styles.likeControl)}>
        {isLiked ? <HeartFilledIcon className={cn(iconClassName, "text-[#B41759]")} /> : <HeartIcon className={iconClassName} />}
      </button>
      <button type="button" aria-label="View likes" onClick={onViewLikes} className={cn(actionButtonClassName, styles.likeControl, styles.counter, "hover:underline")}>
        {likesCount}
      </button>
    </div>
  );
}

function CommentAction({ commentsCount, onComment }: Readonly<Pick<PostActionBarProps, "commentsCount" | "onComment">>) {
  const content = <><MessageCircleIcon className={iconClassName} /><span className={styles.counter}>{commentsCount}</span></>;
  if (!onComment) return <div className={cn(actionButtonClassName, "cursor-default")} aria-label="Comments count">{content}</div>;
  return <button type="button" aria-label="View comments" onClick={onComment} className={actionButtonClassName}>{content}</button>;
}

function ShareAction({ onShare }: Readonly<Pick<PostActionBarProps, "onShare">>) {
  return <button type="button" aria-label="Share post" onClick={onShare} className={actionButtonClassName}><ShareIcon className={iconClassName} /></button>;
}

function SaveAction({ isSaved, onSave }: Readonly<Pick<PostActionBarProps, "isSaved" | "onSave">>) {
  return (
    <button type="button" aria-label={isSaved ? "Remove from saved" : "Save post"} aria-pressed={isSaved} onClick={onSave} className={actionButtonClassName}>
      {isSaved ? <BookmarkFilledIcon className={iconClassName} /> : <BookmarkIcon className={iconClassName} />}
    </button>
  );
}

export function PostActionBar({ className, ...props }: Readonly<PostActionBarProps>) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className={styles.group}>
        <LikeAction isLiked={props.isLiked} likesCount={props.likesCount} onLike={props.onLike} onViewLikes={props.onViewLikes} />
        <CommentAction commentsCount={props.commentsCount} onComment={props.onComment} />
        <ShareAction onShare={props.onShare} />
      </div>
      <SaveAction isSaved={props.isSaved} onSave={props.onSave} />
    </div>
  );
}
