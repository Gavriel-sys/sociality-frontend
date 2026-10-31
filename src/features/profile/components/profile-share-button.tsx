"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShareIcon } from "@/components/ui/icons";

export function ProfileShareButton({ username }: { readonly username: string }) {
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(""), 2000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleShare = async () => {
    try {
      const profileUrl = new URL(`/profile/${encodeURIComponent(username)}`, window.location.origin).href;
      await navigator.clipboard.writeText(profileUrl);
      setFeedback("Copied!");
    } catch {
      setFeedback("Unable to copy link");
    }
  };

  return (
    <div className="relative">
      <Button variant="outline" aria-label="Share profile" title="Share profile" disabled={!username} onClick={() => void handleShare()} className="h-10 min-h-10 w-10 min-w-10 p-0 md:h-12 md:w-12">
        <ShareIcon />
      </Button>
      <span role="status" className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-black px-2 text-xs text-[#FDFDFD]">{feedback}</span>
    </div>
  );
}
