"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { SmileIcon } from "@/components/ui/icons";

const emojis = ["😀", "😅", "🥰", "😇", "🙂", "😋", "🤪", "🤭", "😏", "🤗", "😂", "🙄", "🤔", "😴", "🥵", "😫", "😭", "😱"];

interface CommentEmojiButtonProps {
  readonly disabled: boolean;
  readonly onSelect: (emoji: string) => void;
}

export function CommentEmojiButton({ disabled, onSelect }: Readonly<CommentEmojiButtonProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerId = useId();
  useEffect(() => {
    if (!isOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [isOpen]);

  const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || !isOpen) return;
    event.stopPropagation();
    setIsOpen(false);
    triggerRef.current?.focus();
  };
  return (
    <div ref={containerRef} onKeyDown={closeOnEscape} className="absolute left-1 z-10">
      <button ref={triggerRef} type="button" aria-label="Add emoji" aria-expanded={isOpen && !disabled} aria-controls={pickerId} disabled={disabled} onClick={() => setIsOpen(!isOpen)} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#FDFDFD] hover:bg-[#141820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9] disabled:opacity-50">
        <SmileIcon />
      </button>
      {isOpen && !disabled && (
        <div id={pickerId} role="group" aria-label="Choose emoji" className="absolute bottom-full left-0 mb-2 grid w-64 grid-cols-6 gap-1 rounded-xl border border-[#1F242F] bg-[#0A0D12] p-2 shadow-xl">
          {emojis.map((emoji) => (
            <button key={emoji} type="button" aria-label={`Insert ${emoji}`} onClick={() => { onSelect(emoji); setIsOpen(false); }} className="flex h-9 items-center justify-center rounded text-xl hover:bg-[#141820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]">{emoji}</button>
          ))}
        </div>
      )}
    </div>
  );
}
