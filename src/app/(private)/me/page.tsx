"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ErrorState } from "@/components/feedback/error-state";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { EditProfileDialog } from "@/features/profile/components/edit-profile-dialog";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileGalleryTabs } from "@/features/profile/components/profile-gallery-tabs";
import { UserListDialog } from "@/features/profile/components/user-list-dialog";
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

function ProfileView() {
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
      <main className="w-full max-w-[844px] mx-auto px-4 pt-4 md:pt-10 space-y-6">
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
            <ProfileGalleryTabs />
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
      <FloatingNav activeKey="profile" />
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
