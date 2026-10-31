"use client";

import { useState } from "react";
import type { HTMLAttributes } from "react";
import { UserIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  readonly src?: string;
  readonly alt?: string;
  readonly fallback?: string;
  readonly size?: AvatarSize;
}

const sizeStyles: Record<AvatarSize, { container: string; icon: string; text: string }> = {
  sm: { container: "h-8 w-8 text-xs", icon: "h-4 w-4", text: "text-xs" },
  md: { container: "h-10 w-10 text-sm", icon: "h-5 w-5", text: "text-sm" },
  lg: { container: "h-12 w-12 text-base", icon: "h-6 w-6", text: "text-base" },
  xl: { container: "h-16 w-16 text-lg", icon: "h-8 w-8", text: "text-lg" },
};

function getInitials(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function Avatar({
  src,
  alt = "User avatar",
  fallback,
  size = "md",
  className,
  ...props
}: Readonly<AvatarProps>) {
  const [failedImageSource, setFailedImageSource] = useState<string>();
  const sizeConfig = sizeStyles[size];
  const initials = getInitials(fallback ?? alt);
  const shouldRenderImage = Boolean(src) && failedImageSource !== src;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#1F242F] bg-[#141820] font-medium text-[#FDFDFD] select-none",
        sizeConfig.container,
        className,
      )}
      {...props}
    >
      {shouldRenderImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setFailedImageSource(src)}
          className="h-full w-full object-cover"
        />
      ) : initials ? (
        <span className={sizeConfig.text} aria-label={alt}>
          {initials}
        </span>
      ) : (
        <UserIcon className={cn("text-[#A4A7AE]", sizeConfig.icon)} aria-label={alt} />
      )}
    </div>
  );
}
