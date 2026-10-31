"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/ui/icons";

interface CommentDeleteButtonProps {
  readonly onDelete: () => Promise<void> | void;
  readonly isLoading: boolean;
}

export function CommentDeleteButton({ onDelete, isLoading }: Readonly<CommentDeleteButtonProps>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const handleDelete = async () => {
    try { await onDelete(); } finally { setIsConfirming(false); }
  };
  if (!isConfirming) {
    return (
      <button type="button" aria-label="Delete comment" onClick={() => setIsConfirming(true)} disabled={isLoading} className="rounded p-1 text-[#A4A7AE] hover:text-[#F04438] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F04438]">
        <TrashIcon className="h-4 w-4" />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Confirm deletion">
      <span className="text-xs text-[#A4A7AE]">Delete?</span>
      <button type="button" onClick={handleDelete} disabled={isLoading} className="rounded px-2 py-0.5 text-xs font-semibold text-[#F04438] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F04438] disabled:opacity-50">{isLoading ? "Deleting..." : "Delete"}</button>
      <button type="button" onClick={() => setIsConfirming(false)} disabled={isLoading} className="rounded px-2 py-0.5 text-xs text-[#A4A7AE] hover:text-[#FDFDFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]">Cancel</button>
    </div>
  );
}
