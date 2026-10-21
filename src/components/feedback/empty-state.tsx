import type { HTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyBoxIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  readonly label: string;
  readonly onClick: () => void;
}

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly title: string;
  readonly description?: string;
  readonly action?: EmptyStateAction;
  readonly icon?: ReactNode;
  readonly children?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  children,
  className,
  ...props
}: Readonly<EmptyStateProps>) {
  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        "flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-[#1F242F] bg-[#0A0D12] p-8 text-center",
        className,
      )}
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1F242F] bg-[#141820] text-[#A4A7AE]">
        {icon ?? <EmptyBoxIcon className="h-8 w-8 text-[#A4A7AE]" />}
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-base font-semibold text-[#FDFDFD]">{title}</h3>
        {description ? <p className="text-xs text-[#A4A7AE] leading-relaxed">{description}</p> : undefined}
      </div>
      {action ? (
        <Button variant="primary" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      ) : undefined}
      {children}
    </div>
  );
}
