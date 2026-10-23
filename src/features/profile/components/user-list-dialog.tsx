"use client";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Dialog } from "@/components/ui/dialog";
import { UserRow } from "@/features/users/components/user-row";
import { UserRowSkeleton } from "@/features/users/components/user-row-skeleton";
import type { SearchUser } from "@/features/users/types";

export interface UserListDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly users: readonly SearchUser[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly emptyMessage: string;
  readonly onRetry?: () => void;
}

export function UserListDialog({
  isOpen,
  onClose,
  title,
  users,
  isLoading,
  isError,
  emptyMessage,
  onRetry,
}: Readonly<UserListDialogProps>) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1">
        {isLoading ? (
          <div className="space-y-2 py-1" aria-label={`Loading ${title.toLowerCase()}`}>
            <UserRowSkeleton />
            <UserRowSkeleton />
            <UserRowSkeleton />
            <UserRowSkeleton />
          </div>
        ) : isError ? (
          <ErrorState
            title={`Failed to load ${title.toLowerCase()}`}
            message="An unexpected error occurred while loading this list."
            onRetry={onRetry}
            className="my-2 min-h-[180px] p-4"
          />
        ) : users.length === 0 ? (
          <EmptyState
            title={`No ${title.toLowerCase()} yet`}
            description={emptyMessage}
            className="my-2 min-h-[180px] p-4"
          />
        ) : (
          <div className="divide-y divide-[#1F242F]/40" role="list" aria-label={title}>
            {users.map((user) => (
              <UserRow key={user.id} user={user} onClick={onClose} />
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
