import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: Readonly<SkeletonProps>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-[#141820]", className)}
      {...props}
    />
  );
}
