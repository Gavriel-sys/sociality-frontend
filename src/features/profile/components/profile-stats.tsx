"use client";

import type { UserProfile } from "../types";

interface ProfileStatsProps {
  readonly profile: UserProfile;
  readonly onFollowersClick?: () => void;
  readonly onFollowingClick?: () => void;
}

const counterClassName = "flex min-w-0 flex-col items-center gap-1 text-xs md:gap-2 md:text-base";
const counterButtonClassName = `${counterClassName} rounded transition-colors hover:text-[#7F51F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]`;

function ProfileCounter({ count, label }: { readonly count: number; readonly label: string }) {
  return (
    <>
      <span className="text-lg font-bold text-[#FDFDFD] md:text-xl">{count}</span>
      <span className="text-[#A4A7AE]">{label}</span>
    </>
  );
}

export function ProfileStats({ profile, onFollowersClick, onFollowingClick }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-4 divide-x divide-[#1F242F] py-0.5">
      <div className={counterClassName}><ProfileCounter count={profile.postsCount} label="Posts" /></div>
      <button type="button" onClick={onFollowersClick} aria-haspopup="dialog" aria-label={`${profile.followersCount} Followers`} className={counterButtonClassName}>
        <ProfileCounter count={profile.followersCount} label="Followers" />
      </button>
      <button type="button" onClick={onFollowingClick} aria-haspopup="dialog" aria-label={`${profile.followingCount} Following`} className={counterButtonClassName}>
        <ProfileCounter count={profile.followingCount} label="Following" />
      </button>
      <div className={counterClassName}><ProfileCounter count={profile.likesCount ?? 0} label="Likes" /></div>
    </div>
  );
}
