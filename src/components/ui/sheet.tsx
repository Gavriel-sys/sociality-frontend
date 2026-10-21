"use client";

import { useEffect, useId } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface SheetProps extends HTMLAttributes<HTMLDivElement> {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly children?: ReactNode;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  ...props
}: Readonly<SheetProps>) {
  const sheetId = useId();
  const titleId = title ? `${sheetId}-title` : undefined;
  const descriptionId = description ? `${sheetId}-description` : undefined;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return <></>;
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "relative w-full max-w-lg rounded-t-2xl border-t border-[#1F242F] bg-[#0A0D12] p-6 shadow-2xl transition-all",
          "animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto",
          className,
        )}
        {...props}
      >
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-[#1F242F]" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close bottom sheet"
          className="absolute right-4 top-4 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#A4A7AE] hover:bg-[#141820] hover:text-[#FDFDFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {title ? (
          <h2 id={titleId} className="text-xl font-semibold tracking-tight text-[#FDFDFD]">
            {title}
          </h2>
        ) : undefined}

        {description ? (
          <p id={descriptionId} className="mt-1 text-sm text-[#A4A7AE]">
            {description}
          </p>
        ) : undefined}

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
