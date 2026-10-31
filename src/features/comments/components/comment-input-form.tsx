"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommentEmojiButton } from "./comment-emoji-button";
import { useCommentInput } from "./use-comment-input";

export interface CommentInputFormProps {
  readonly onSubmit: (content: string) => Promise<void> | void;
  readonly isLoading?: boolean;
  readonly placeholder?: string;
  readonly className?: string;
}

export function CommentInputForm({ onSubmit, isLoading, placeholder = "Add a comment...", className }: Readonly<CommentInputFormProps>) {
  const { content, inputRef, errorMessage, isBusy, isSubmitDisabled, handleChange, handleSubmit, insertEmoji } = useCommentInput({ onSubmit, isLoading });
  return (
    <form aria-label="Add a comment" onSubmit={handleSubmit} className={cn("flex w-full flex-col gap-1.5", className)}>
      <div className="relative flex w-full items-center">
        <CommentEmojiButton disabled={isBusy} onSelect={insertEmoji} />
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isBusy}
          aria-label={placeholder}
          aria-invalid={errorMessage ? "true" : undefined}
          className={cn(
            "h-12 w-full rounded-xl border bg-[#0A0D12] pl-14 pr-20 text-base text-[#FDFDFD]",
            "placeholder-[#A4A7AE]/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            errorMessage ? "border-[#B41759] focus-visible:ring-[#B41759]" : "border-[#1F242F] focus-visible:ring-[#7F51F9]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        <Button type="submit" variant="ghost" size="sm" isLoading={isBusy} disabled={isSubmitDisabled}
          className="absolute right-1 rounded-lg px-3 text-sm font-semibold text-[#7F51F9] disabled:text-[#A4A7AE]"
        >Post</Button>
      </div>
      {errorMessage && <p role="alert" className="px-3 text-xs text-[#B41759]">{errorMessage}</p>}
    </form>
  );
}
