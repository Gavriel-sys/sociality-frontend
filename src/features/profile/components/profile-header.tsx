"use client";

import { useLogout } from "@/features/auth/use-logout";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "../types";

export interface ProfileHeaderProps {
  readonly profile: UserProfile;
  readonly onLogout?: () => void;
}

function LogOutIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function ProfileHeader({
  profile,
  onLogout,
}: Readonly<ProfileHeaderProps>) {
  const logoutAction = useLogout();
  const handleLogout = onLogout ?? (() => logoutAction());

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Top section: Avatar and User Details */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <Avatar
          src={profile.avatarUrl}
          fallback={profile.name || profile.username}
          alt={`${profile.name || profile.username}'s profile photo`}
          size="xl"
          className="h-16 w-16 md:h-20 md:w-20 ring-2 ring-[#1F242F]"
        />

        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#FDFDFD] truncate">
            {profile.name || "Anonymous User"}
          </h1>
          <p className="text-sm font-medium text-[#A4A7AE] truncate">
            @{profile.username}
          </p>
          <p className="text-sm text-[#FDFDFD]/80 pt-1 leading-relaxed max-w-lg break-words">
            {profile.bio || "No bio yet"}
          </p>
        </div>
      </div>

      {/* Stats counter row */}
      <div className="flex items-center gap-6 sm:gap-8 border-y border-[#1F242F] py-3 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[#FDFDFD]">{profile.postsCount}</span>
          <span className="text-[#A4A7AE]">Posts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[#FDFDFD]">{profile.followersCount}</span>
          <span className="text-[#A4A7AE]">Followers</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[#FDFDFD]">{profile.followingCount}</span>
          <span className="text-[#A4A7AE]">Following</span>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center gap-3">
        <div className="relative inline-flex items-center">
          <Button
            variant="outline"
            size="sm"
            disabled
            aria-disabled="true"
            title="Available in Stage 7"
            className="cursor-not-allowed opacity-60"
          >
            Edit profile
          </Button>
          <span className="sr-only">Available in Stage 7</span>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleLogout}
          aria-label="Log out of account"
        >
          <LogOutIcon />
          <span>Log out</span>
        </Button>
      </div>
    </div>
  );
}
