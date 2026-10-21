import type { HTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, RefreshIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly title?: string;
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly isRetrying?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this content.",
  onRetry,
  retryLabel = "Try again",
  isRetrying = false,
  className,
  ...props
}: Readonly<ErrorStateProps>) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-[#B41759]/40 bg-[#0A0D12] p-8 text-center",
        className,
      )}
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#B41759]/30 bg-[#B41759]/10 text-[#B41759]">
        <AlertCircleIcon className="h-8 w-8" />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-base font-semibold text-[#FDFDFD]">{title}</h3>
        <p className="text-xs text-[#A4A7AE] leading-relaxed">{message}</p>
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          isLoading={isRetrying}
          onClick={onRetry}
          className="mt-2 border-[#1F242F] hover:border-[#B41759]/50"
        >
          <RefreshIcon className="h-4 w-4" />
          {retryLabel}
        </Button>
      ) : undefined}
    </div>
  );
}
