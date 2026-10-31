"use client";

import { useState } from "react";
import type { HTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { HomeIcon, PlusIcon, UserIcon } from "@/components/ui/icons";
import { CreatePostDialog } from "@/features/posts/components/create-post-dialog";
import { cn } from "@/lib/utils";

export type NavItemKey = "home" | "add" | "profile";

export interface FloatingNavProps extends HTMLAttributes<HTMLElement> {
  readonly activeKey?: NavItemKey;
  readonly onSelectKey?: (key: NavItemKey) => void;
}

function useSafeRouter(): ReturnType<typeof useRouter> | undefined {
  try {
    return useRouter();
  } catch {
    return undefined;
  }
}

export function FloatingNav({
  activeKey = "home",
  onSelectKey,
  className,
  ...props
}: Readonly<FloatingNavProps>) {
  const router = useSafeRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleSelectKey = (key: NavItemKey) => {
    if (onSelectKey) {
      onSelectKey(key);
      return;
    }
    if (key === "home") {
      router?.push("/feed");
    } else if (key === "profile") {
      router?.push("/me");
    } else if (key === "add") {
      setIsCreateOpen(true);
    }
  };

  return (
    <>
      <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-6 inset-x-0 mx-auto z-40 flex items-center justify-around px-6",
        "w-[345px] h-16 md:w-[360px] md:h-20",
        "rounded-full border border-[#1F242F] bg-[#0A0D12]/95 backdrop-blur-xl shadow-2xl transition-all duration-200",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => handleSelectKey("home")}
        aria-label="Home"
        aria-current={activeKey === "home" ? "page" : undefined}
        className={cn(
          "inline-flex flex-col items-center justify-center gap-1 rounded-full p-2 transition-colors",
          "min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]",
          activeKey === "home" ? "text-[#7F51F9]" : "text-[#A4A7AE] hover:text-[#FDFDFD]",
        )}
      >
        <HomeIcon className="h-6 w-6" />
        <span className="text-[10px] font-medium leading-none">Home</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelectKey("add")}
        aria-label="Create post"
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-[#6936F2] text-[#FDFDFD] shadow-lg shadow-[#6936F2]/30",
          "h-11 w-11 md:h-12 md:w-12 min-h-[44px] min-w-[44px] transition-all hover:bg-[#7F51F9] hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        )}
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={() => handleSelectKey("profile")}
        aria-label="Profile"
        aria-current={activeKey === "profile" ? "page" : undefined}
        className={cn(
          "inline-flex flex-col items-center justify-center gap-1 rounded-full p-2 transition-colors",
          "min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]",
          activeKey === "profile" ? "text-[#7F51F9]" : "text-[#FDFDFD] hover:text-[#7F51F9]",
        )}
      >
        <UserIcon className="h-6 w-6" />
        <span className="text-[10px] font-medium leading-none">Profile</span>
      </button>
    </nav>
    <CreatePostDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
  </>
  );
}
