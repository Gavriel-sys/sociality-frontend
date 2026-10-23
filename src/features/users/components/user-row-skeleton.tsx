import type { HTMLAttributes } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type UserRowSkeletonProps = HTMLAttributes<HTMLDivElement>;

export function UserRowSkeleton({ className, ...props }: Readonly<UserRowSkeletonProps>) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading user"
      className={cn(
        "flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-transparent p-3",
        className,
      )}
      {...props}
    >
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
        <Skeleton className="h-3 w-44 rounded-md" />
      </div>
      <span className="sr-only">Loading user...</span>
    </div>
  );
}
