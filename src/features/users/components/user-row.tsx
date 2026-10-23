import type { HTMLAttributes } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { SearchUser } from "@/features/users/types";
import { cn } from "@/lib/utils";

export interface UserRowProps extends HTMLAttributes<HTMLDivElement> {
  readonly user: SearchUser;
}

export function UserRow({ user, className, ...props }: Readonly<UserRowProps>) {
  const displayName = user.name.trim().length > 0 ? user.name : user.username;
  const usernameHandle = `@${user.username}`;

  return (
    <div className={cn("w-full", className)} {...props}>
      <Link
        href={`/profile/${encodeURIComponent(user.username)}`}
        aria-label={`View ${displayName}'s profile`}
        className={cn(
          "group flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-transparent p-3 transition-colors",
          "hover:border-[#1F242F] hover:bg-[#141820] active:bg-[#141820]/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]",
        )}
      >
        <Avatar
          src={user.avatarUrl}
          fallback={displayName}
          alt={`${displayName}'s avatar`}
          size="md"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-[#FDFDFD]">
              {displayName}
            </span>
            <span className="truncate text-xs text-[#A4A7AE]">
              {usernameHandle}
            </span>
          </div>
          {user.bio ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-[#A4A7AE]">
              {user.bio}
            </p>
          ) : undefined}
        </div>
      </Link>
    </div>
  );
}
