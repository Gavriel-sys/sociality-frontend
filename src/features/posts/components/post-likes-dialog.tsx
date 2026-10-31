"use client";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserFollowing } from "@/features/profile/use-user-network";
import type { SearchUser } from "@/features/users/types";
import { useAppSelector } from "@/lib/store/hooks";
import { PostLikesUserRow } from "./post-likes-user-row";
import styles from "./post-likes-dialog.module.css";

export interface PostLikesDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly users: readonly SearchUser[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly onRetry: () => void;
}

function PostLikesList({ users, onClose }: Pick<PostLikesDialogProps, "users" | "onClose">) {
  const currentUsername = useAppSelector((state) => state.auth.user?.username);
  const needsFollowing = users.some((user) => user.isFollowing === undefined);
  const { users: followingUsers, isLoading } = useUserFollowing(needsFollowing ? currentUsername ?? "" : "");
  const followingUsernames = new Set(followingUsers.map((user) => user.username.trim().toLowerCase()));
  return (
    <div className={styles.list} role="list" aria-label="Likes">
      {users.map((user) => <PostLikesUserRow key={user.id} user={user} currentUsername={currentUsername} onClose={onClose}
        isFollowing={user.isFollowing ?? followingUsernames.has(user.username.trim().toLowerCase())}
        isLoading={user.isFollowing === undefined && isLoading} />)}
    </div>
  );
}

function PostLikesLoading() {
  return (
    <div className={styles.list} aria-label="Loading likes" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className={styles.row} key={index}>
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-16" /></div>
          <Skeleton className="h-10 w-[93px] rounded-full" />
        </div>
      ))}
    </div>
  );
}

function PostLikesContent({ users, isLoading, isError, onRetry, onClose }: Omit<PostLikesDialogProps, "isOpen">) {
  if (isLoading) return <PostLikesLoading />;
  if (isError) return <ErrorState title="Failed to load likes" onRetry={onRetry} className="min-h-[180px]" />;
  if (users.length === 0) return <EmptyState title="No likes yet" description="No likes on this post yet" className="min-h-[180px]" />;
  return <PostLikesList users={users} onClose={onClose} />;
}

export function PostLikesDialog({ isOpen, ...props }: Readonly<PostLikesDialogProps>) {
  return (
    <Dialog isOpen={isOpen} onClose={props.onClose} title="Likes" className={styles.dialog} overlayClassName={styles.overlay}>
      <PostLikesContent {...props} />
    </Dialog>
  );
}
