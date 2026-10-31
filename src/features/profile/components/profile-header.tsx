"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "../types";
import { ProfileShareButton } from "./profile-share-button";
import { ProfileStats } from "./profile-stats";

export interface ProfileHeaderProps {
  readonly profile: UserProfile;
  readonly onFollowersClick?: () => void;
  readonly onFollowingClick?: () => void;
  readonly onEditProfile?: () => void;
}

export function ProfileHeader({ profile, onFollowersClick, onFollowingClick, onEditProfile }: Readonly<ProfileHeaderProps>) {
  return (
    <section aria-label="Your profile" className="flex flex-col gap-5">
      <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 md:grid-cols-[64px_minmax(0,1fr)_auto] md:gap-x-5">
        <Avatar src={profile.avatarUrl} fallback={profile.name || profile.username} alt={`${profile.name || profile.username}'s profile photo`} size="xl" />
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-sm font-bold text-[#FDFDFD] md:text-base">{profile.name || "Anonymous User"}</h1>
          <p className="truncate text-sm text-[#FDFDFD] md:text-base">{profile.username}</p>
        </div>
        <div className="col-span-2 flex items-center gap-3 md:col-span-1">
          <Button variant="outline" onClick={onEditProfile} aria-label="Edit profile" className="h-10 min-h-10 flex-1 font-bold md:h-12 md:flex-none md:text-base">Edit Profile</Button>
          <ProfileShareButton username={profile.username} />
        </div>
      </div>
      <p className="break-words text-sm leading-7 text-[#FDFDFD] md:text-base">{profile.bio || "No bio yet"}</p>
      <ProfileStats profile={profile} onFollowersClick={onFollowersClick} onFollowingClick={onFollowingClick} />
    </section>
  );
}
