"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followUser, unfollowUser } from "@/lib/social-api";
import { buildLoginHref, getToken } from "@/lib/session";
import type { UserSummary } from "@/types/social";
import { Button } from "@/components/ui/button";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

type UserChipProps = {
  user: UserSummary;
  showFollowAction?: boolean;
};

export function UserChip({
  user,
  showFollowAction = true,
}: UserChipProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!getToken()) {
        router.push(buildLoginHref(pathname));
        return;
      }

      if (user.isFollowedByMe) {
        return unfollowUser(user.username);
      }

      return followUser(user.username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({});
    },
  });

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={`/profile/${user.username}`}
        className="flex min-w-0 items-center gap-4"
      >
        <img
          src={user.avatarUrl || DEFAULT_AVATAR}
          alt={user.name}
          className="h-14 w-14 rounded-full object-cover ring-1 ring-white/10"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-white">{user.name}</p>
            {user.isMe ? (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/45">
                You
              </span>
            ) : null}
          </div>
          <p className="truncate text-sm text-white/55">@{user.username}</p>
        </div>
      </Link>

      {showFollowAction && !user.isMe ? (
        <Button
          type="button"
          variant={user.isFollowedByMe ? "outline" : "default"}
          onClick={() => followMutation.mutate()}
          disabled={followMutation.isPending}
          className="h-11 rounded-full px-5"
        >
          {followMutation.isPending
            ? "Memproses..."
            : user.isFollowedByMe
              ? "Following"
              : "Follow"}
        </Button>
      ) : null}
    </div>
  );
}

