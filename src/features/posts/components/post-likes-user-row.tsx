"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/features/profile/components/follow-button";
import { useFollowToggle } from "@/features/profile/use-follow-toggle";
import type { SearchUser } from "@/features/users/types";
import styles from "./post-likes-dialog.module.css";

interface PostLikesUserRowProps {
  readonly user: SearchUser;
  readonly isFollowing: boolean;
  readonly isLoading: boolean;
  readonly currentUsername?: string;
  readonly onClose: () => void;
}

function UserFollowAction({ user, isFollowing, isLoading }: Pick<PostLikesUserRowProps, "user" | "isFollowing" | "isLoading">) {
  const follow = useFollowToggle({ username: user.username, isFollowing, followersCount: 0 });
  return <FollowButton appearance="pill" isFollowing={follow.isFollowing} isLoading={isLoading || follow.isLoading} onClick={() => void follow.toggleFollow()} />;
}

export function PostLikesUserRow({ user, isFollowing, isLoading, currentUsername, onClose }: Readonly<PostLikesUserRowProps>) {
  const displayName = user.name.trim() || user.username;
  const isSelf = currentUsername?.trim().toLowerCase() === user.username.trim().toLowerCase();
  return (
    <div className={styles.row} role="listitem">
      <Link href={`/profile/${encodeURIComponent(user.username)}`} aria-label={`View ${displayName}'s profile`} onClick={onClose} className={styles.profile}>
        <Avatar src={user.avatarUrl} alt={`${displayName}'s avatar`} fallback={displayName} size="lg" />
        <div className={styles.identity}>
          <span className={styles.name}>{displayName}</span>
          <span className={styles.username}>{user.username}</span>
        </div>
      </Link>
      {!isSelf && <UserFollowAction user={user} isFollowing={isFollowing} isLoading={isLoading} />}
    </div>
  );
}
