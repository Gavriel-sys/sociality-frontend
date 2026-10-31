"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FollowingIcon } from "./following-icon";
import styles from "./follow-button.module.css";

export interface FollowButtonProps {
  readonly isFollowing: boolean;
  readonly onClick?: () => void;
  readonly isLoading?: boolean;
  readonly isSelf?: boolean;
  readonly className?: string;
  readonly appearance?: "default" | "pill";
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return undefined;
  }
}

export function FollowButton({
  isFollowing,
  onClick,
  isLoading = false,
  isSelf = false,
  className,
  appearance = "default",
}: Readonly<FollowButtonProps>) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useSafeRouter();
  const appearanceClassName = appearance === "pill" ? cn(styles.pill, isFollowing && styles.following) : undefined;

  const handleSelfClick = () => {
    if (onClick) {
      onClick();
    } else {
      router?.push("/me");
    }
  };

  if (isSelf) {
    return (
      <Button
        variant="outline"
        size="sm"
        isLoading={isLoading}
        onClick={handleSelfClick}
        aria-label="Edit profile"
        className={cn(
          "min-h-[44px] min-w-[110px] border-[#1F242F] bg-[#0A0D12] text-[#FDFDFD] hover:bg-[#141820]",
          className,
          appearanceClassName,
        )}
      >
        Edit profile
      </Button>
    );
  }

  if (isFollowing) {
    const label = isHovered ? "Unfollow" : "Following";
    return (
      <Button
        variant="outline"
        size="sm"
        isLoading={isLoading}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={label}
        className={cn(
          "min-h-[44px] min-w-[110px] border-[#1F242F] bg-[#0A0D12] text-[#FDFDFD]",
          "hover:border-[#B41759]/60 hover:bg-[#B41759]/10 hover:text-[#B41759]",
          className,
          appearanceClassName,
        )}
      >
        {appearance === "pill" && !isLoading && <FollowingIcon />}
        {label}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      isLoading={isLoading}
      onClick={onClick}
      aria-label="Follow"
      className={cn(
        "min-h-[44px] min-w-[110px] bg-[#6936F2] hover:bg-[#7F51F9] text-[#FDFDFD]",
        className,
        appearanceClassName,
      )}
    >
      Follow
    </Button>
  );
}
