"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, authHeaders, unwrapResponse } from "@/lib/api";
import type {
  FeedData,
  PostItem,
  UserProfile,
  UserPublicData,
  UserStats,
} from "@/types/social";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";

type SearchProfileItem = UserProfile & {
  stats?: UserStats;
  isFollowing?: boolean;
};

type SearchProfilePayload =
  | SearchProfileItem
  | SearchProfileItem[]
  | {
      items?: SearchProfileItem[];
      profile?: SearchProfileItem;
    };

function findProfileByUsername(
  payload: SearchProfilePayload,
  username: string,
): SearchProfileItem | undefined {
  if (Array.isArray(payload)) {
    return payload.find((user) => user.username === username);
  }

  if ("items" in payload && Array.isArray(payload.items)) {
    const found = payload.items.find((user) => user.username === username);
    if (found) return found;
  }

  if ("profile" in payload && payload.profile) {
    return payload.profile;
  }

  if ("username" in payload && payload.username === username) {
    return payload;
  }

  return undefined;
}

function getPostsFromPayload(payload: FeedData | PostItem[]): PostItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.items ?? [];
}

async function fetchProfile(username: string): Promise<UserPublicData> {
  const [profileRes, postsRes] = await Promise.all([
    api.get(`/users/search?query=${encodeURIComponent(username)}`, {
      headers: authHeaders(),
    }),
    api.get("/feed", {
      headers: authHeaders(),
    }),
  ]);

  const profileRaw = unwrapResponse<SearchProfilePayload>(profileRes);
  const postsRaw = unwrapResponse<FeedData | PostItem[]>(postsRes);

  const foundProfile = findProfileByUsername(profileRaw, username);
  const allPosts = getPostsFromPayload(postsRaw);

  return {
    profile: foundProfile ?? {
      id: 0,
      name: username,
      username,
      avatarUrl: null,
      bio: null,
    },
    stats: foundProfile?.stats ?? {
      followers: 0,
      following: 0,
      likes: 0,
      posts: 0,
    },
    posts: allPosts.filter((post) => {
      const author = post.author ?? post.user;
      return author?.username === username;
    }),
    isFollowing: Boolean(foundProfile?.isFollowing),
  };
}

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = String(params.username);
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfile(username),
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (data?.isFollowing) {
        await api.delete(`/follows/${username}`, {
          headers: authHeaders(),
        });
      } else {
        await api.post(
          `/follows/${username}`,
          {},
          {
            headers: authHeaders(),
          },
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  if (isPending) return <div>Loading profile...</div>;
  if (error || !data?.profile) return <div>Profile tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4 space-y-3">
        <img
          src={data.profile.avatarUrl ?? "/avatars/default-avatar.png"}
          alt="Avatar"
          className="h-24 w-24 rounded-full object-cover"
        />

        <div className="text-2xl font-bold">{data.profile.name}</div>
        <div className="text-sm text-gray-500">@{data.profile.username}</div>
        <div>{data.profile.bio ?? "Belum ada bio"}</div>

        <div className="text-sm text-gray-500">
          Posts: {data.stats.posts} · Followers: {data.stats.followers} ·
          Following: {data.stats.following}
        </div>

        <Button
          type="button"
          onClick={() => followMutation.mutate()}
          disabled={followMutation.isPending}
        >
          {data.isFollowing ? "Unfollow" : "Follow"}
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Posts</h2>

        {!data.posts || data.posts.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-gray-500">
            Belum ada post dari user ini
          </div>
        ) : (
          data.posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
