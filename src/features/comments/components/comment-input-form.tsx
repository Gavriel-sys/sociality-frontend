"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { commentInputSchema } from "../types";

export interface CommentInputFormProps {
  readonly onSubmit: (content: string) => Promise<void> | void;
  readonly isLoading?: boolean;
  readonly placeholder?: string;
  readonly className?: string;
}

export function CommentInputForm({
  onSubmit,
  isLoading = false,
  placeholder = "Add a comment...",
  className,
}: Readonly<CommentInputFormProps>) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmed = content.trim();
  const isBusy = isLoading || isSubmitting;
  const isSubmitDisabled = trimmed.length === 0 || trimmed.length > 500 || isBusy;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setContent(event.target.value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = commentInputSchema.safeParse(trimmed);
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message ?? "Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit(trimmed);
      setContent("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      aria-label="Add a comment"
      onSubmit={handleSubmit}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      <div className="relative flex w-full items-center">
        <input
          type="text"
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isBusy}
          aria-label={placeholder}
          aria-invalid={errorMessage ? "true" : undefined}
          className={cn(
            "h-11 min-h-[44px] w-full rounded-full border bg-[#0A0D12] pl-4 pr-20 text-sm text-[#FDFDFD]",
            "placeholder-[#A4A7AE]/60 transition-colors",
            "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            errorMessage
              ? "border-[#B41759] focus-visible:border-[#B41759] focus-visible:ring-[#B41759]"
              : "border-[#1F242F] focus-visible:border-transparent focus-visible:ring-[#7F51F9]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isBusy}
          disabled={isSubmitDisabled}
          className="absolute right-1.5 h-8 min-h-[32px] px-3.5 text-xs font-semibold rounded-full"
        >
          Post
        </Button>
      </div>
      {errorMessage ? (
        <p role="alert" className="px-3 text-xs text-[#B41759]">
          {errorMessage}
        </p>
      ) : undefined}
    </form>
  );
}
