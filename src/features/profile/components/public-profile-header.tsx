"use client";

import { useContext } from "react";
import { ReactReduxContext } from "react-redux";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { PublicUserProfile } from "../types";
import { useFollowToggle } from "../use-follow-toggle";
import { FollowButton } from "./follow-button";

export interface PublicProfileHeaderProps {
  readonly profile: PublicUserProfile;
  readonly isSelf?: boolean;
  readonly onFollowToggle?: () => void;
  readonly isFollowLoading?: boolean;
  readonly onFollowersClick?: () => void;
  readonly onFollowingClick?: () => void;
  readonly className?: string;
}

function useIsSelfAuth(username: string): boolean {
  const reduxContext = useContext(ReactReduxContext);
  if (!reduxContext) return false;
  const state = reduxContext.store.getState() as { auth?: { user?: { username?: string } } } | undefined;
  const currentUsername = state?.auth?.user?.username;
  return Boolean(currentUsername && currentUsername.toLowerCase() === username.toLowerCase());
}

export function PublicProfileHeader({
  profile,
  isSelf,
  onFollowToggle,
  isFollowLoading,
  onFollowersClick,
  onFollowingClick,
  className,
}: Readonly<PublicProfileHeaderProps>) {
  const detectedSelf = useIsSelfAuth(profile.username);
  const resolvedSelf = isSelf !== undefined ? isSelf : detectedSelf;
  const displayName = profile.name || profile.username || "Anonymous User";

  const followToggle = useFollowToggle({
    username: profile.username,
    isFollowing: profile.isFollowing,
    followersCount: profile.followersCount,
  });

  const handleFollowToggle = onFollowToggle ?? followToggle.toggleFollow;
  const resolvedLoading = isFollowLoading ?? followToggle.isLoading;
  const resolvedFollowing = onFollowToggle !== undefined ? profile.isFollowing : followToggle.isFollowing;
  const resolvedFollowers = onFollowToggle !== undefined ? profile.followersCount : followToggle.followersCount;

  return (
    <div className={cn("flex flex-col gap-5 py-4", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <Avatar
          src={profile.avatarUrl}
          fallback={displayName}
          alt={`${displayName}'s profile photo`}
          size="xl"
          className="h-16 w-16 md:h-20 md:w-20 ring-2 ring-[#1F242F]"
        />

        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#FDFDFD] truncate">
            {displayName}
          </h1>
          <p className="text-sm font-medium text-[#A4A7AE] truncate">
            @{profile.username}
          </p>
          <p className="text-sm text-[#FDFDFD]/80 pt-1 leading-relaxed max-w-lg break-words">
            {profile.bio || "No bio yet"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 border-y border-[#1F242F] py-3 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[#FDFDFD]">{profile.postsCount}</span>
          <span className="text-[#A4A7AE]">Posts</span>
        </div>
        <button
          type="button"
          onClick={onFollowersClick}
          aria-haspopup="dialog"
          aria-label={`${resolvedFollowers} Followers`}
          className="flex items-center gap-1.5 rounded transition-colors hover:text-[#7F51F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
        >
          <span className="font-bold text-[#FDFDFD]">{resolvedFollowers}</span>
          <span className="text-[#A4A7AE]">Followers</span>
        </button>
        <button
          type="button"
          onClick={onFollowingClick}
          aria-haspopup="dialog"
          aria-label={`${profile.followingCount} Following`}
          className="flex items-center gap-1.5 rounded transition-colors hover:text-[#7F51F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
        >
          <span className="font-bold text-[#FDFDFD]">{profile.followingCount}</span>
          <span className="text-[#A4A7AE]">Following</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <FollowButton
          isFollowing={resolvedFollowing}
          onClick={handleFollowToggle}
          isLoading={resolvedLoading}
          isSelf={resolvedSelf}
        />
      </div>
    </div>
  );
}
