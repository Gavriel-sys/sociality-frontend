import type { HTMLAttributes } from "react";
import { SpinnerIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly message?: string;
  readonly description?: string;
}

export function LoadingState({
  message = "Loading content...",
  description,
  className,
  ...props
}: Readonly<LoadingStateProps>) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-[#1F242F] bg-[#0A0D12] p-8 text-center",
        className,
      )}
      {...props}
    >
      <SpinnerIcon className="h-8 w-8 text-[#6936F2]" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-[#FDFDFD]">{message}</p>
        {description ? <p className="text-xs text-[#A4A7AE]">{description}</p> : undefined}
      </div>
    </div>
  );
}
