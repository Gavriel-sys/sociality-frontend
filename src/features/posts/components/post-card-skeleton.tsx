import type { HTMLAttributes } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type PostCardSkeletonProps = HTMLAttributes<HTMLDivElement>;

export function PostCardSkeleton({ className, ...props }: Readonly<PostCardSkeletonProps>) {
  return (
    <div
      role="status"
      aria-label="Loading post"
      aria-busy="true"
      className={cn(
        "flex w-full max-w-[361px] flex-col gap-3 rounded-2xl border border-[#1F242F] bg-[#0A0D12] p-4 md:max-w-[600px]",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      <Skeleton className="aspect-square w-full rounded-lg" />

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-14 rounded-lg" />
          <Skeleton className="h-8 w-14 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      <div className="space-y-2 pt-1">
        <Skeleton className="h-3.5 w-5/6 rounded" />
        <Skeleton className="h-3.5 w-2/5 rounded" />
      </div>
    </div>
  );
}
