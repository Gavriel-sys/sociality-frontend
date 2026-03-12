import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[1040px] px-4 pb-28 pt-8 sm:px-6 lg:px-8", className)}>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/42">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-white/58 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {children}
    </div>
  );
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-[#050b16]/88 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.34)] backdrop-blur-sm sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
