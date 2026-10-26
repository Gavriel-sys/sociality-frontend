"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditProfileDialog } from "@/features/profile/components/edit-profile-dialog";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { UserListDialog } from "@/features/profile/components/user-list-dialog";
import type { UserProfile } from "@/features/profile/types";
import { useMyProfile } from "@/features/profile/use-my-profile";
import { useUserFollowers, useUserFollowing } from "@/features/profile/use-user-network";

function ProfileSkeleton() {
  return (
    <div className="space-y-6 py-4 animate-pulse" aria-label="Loading profile">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-full shrink-0" />
        <div className="space-y-2 flex-1"><Skeleton className="h-6 w-44" /><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-60" /></div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" /><Skeleton className="h-44 w-full rounded-2xl" />
    </div>
  );
}

function ProfileOverviewTab({ profile }: { readonly profile: UserProfile }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1F242F] bg-[#0A0D12] p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A4A7AE]">Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-[#A4A7AE]">Email: </span><span className="text-[#FDFDFD]">{profile.email ?? "Not provided"}</span></div>
          <div><span className="text-[#A4A7AE]">User ID: </span><span className="text-[#FDFDFD]">{String(profile.id)}</span></div>
        </div>
      </div>
      <div className="rounded-2xl border border-[#1F242F] bg-[#0A0D12] p-5 text-center sm:text-left">
        <p className="text-xs sm:text-sm text-[#A4A7AE] leading-relaxed">Posts, Saved, and Liked collections will be integrated in Stages 3–5.</p>
      </div>
    </div>
  );
}

function ProfileView() {
  const router = useRouter();
  const [dialogType, setDialogType] = useState<"followers" | "following" | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { profile, isLoading, isError, error, refetch } = useMyProfile();
  const username = profile?.username ?? "";
  const { users: followers, isLoading: isFollowersLoading, isError: isFollowersError, refetch: refetchFollowers } =
    useUserFollowers(dialogType === "followers" ? username : "");
  const { users: following, isLoading: isFollowingLoading, isError: isFollowingError, refetch: refetchFollowing } =
    useUserFollowing(dialogType === "following" ? username : "");

  return (
    <div className="min-h-screen bg-black text-[#FDFDFD] pb-32">
      <Header userAvatarSrc={profile?.avatarUrl} userFallback={profile?.name || profile?.username} />
      <main className="w-full max-w-[361px] md:max-w-[812px] mx-auto px-4 pt-6 space-y-6">
        {isLoading ? (
          <ProfileSkeleton />
        ) : isError || !profile ? (
          <ErrorState
            title="Failed to load profile"
            message={error?.message ?? "An unexpected error occurred."}
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            <ProfileHeader
              profile={profile}
              onFollowersClick={() => setDialogType("followers")}
              onFollowingClick={() => setDialogType("following")}
              onEditProfile={() => setIsEditOpen(true)}
            />
            <Tabs defaultValue="overview">
              <TabsList aria-label="Profile navigation tabs" className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
                <TabsTrigger value="likes">Likes</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview"><ProfileOverviewTab profile={profile} /></TabsContent>
              <TabsContent value="posts"><EmptyState title="No posts yet" description="This section will be integrated in Stages 3–5." /></TabsContent>
              <TabsContent value="saved"><EmptyState title="No saved posts" description="This section will be integrated in Stages 3–5." /></TabsContent>
              <TabsContent value="likes"><EmptyState title="No liked posts" description="This section will be integrated in Stages 3–5." /></TabsContent>
              <TabsContent value="settings"><EmptyState title="Settings unavailable" description="Account settings will be integrated in Stage 7." /></TabsContent>
            </Tabs>
            <UserListDialog
              isOpen={dialogType !== null}
              onClose={() => setDialogType(null)}
              title={dialogType === "followers" ? "Followers" : "Following"}
              users={dialogType === "followers" ? followers : following}
              isLoading={dialogType === "followers" ? isFollowersLoading : isFollowingLoading}
              isError={dialogType === "followers" ? isFollowersError : isFollowingError}
              emptyMessage={dialogType === "followers" ? "No followers yet" : "Not following anyone yet"}
              onRetry={dialogType === "followers" ? () => void refetchFollowers() : () => void refetchFollowing()}
            />
            <EditProfileDialog
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              profile={profile}
            />
          </>
        )}
      </main>
      <FloatingNav activeKey="profile" onSelectKey={(key) => { if (key === "home") router.push("/"); }} />
    </div>
  );
}

export default function MeProfilePage() {
  return (
    <AuthGuard>
      <ProfileView />
    </AuthGuard>
  );
}
