import type { HTMLAttributes } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type CommentRowSkeletonProps = HTMLAttributes<HTMLDivElement>;

export function CommentRowSkeleton({ className, ...props }: Readonly<CommentRowSkeletonProps>) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading comment"
      className={cn("flex items-start gap-3 py-3", className)}
      {...props}
    >
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-4 w-4/5 rounded" />
      </div>
      <span className="sr-only">Loading comment...</span>
    </div>
  );
}
