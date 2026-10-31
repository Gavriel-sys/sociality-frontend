"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent, RefObject } from "react";
import { commentInputSchema } from "../types";
import type { CommentInputFormProps } from "./comment-input-form";

interface CommentInputState {
  readonly content: string;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly errorMessage?: string;
  readonly isBusy: boolean;
  readonly isSubmitDisabled: boolean;
  readonly handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly insertEmoji: (emoji: string) => void;
}

export function useCommentInput({ onSubmit, isLoading = false }: Readonly<CommentInputFormProps>): CommentInputState {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const inFlightRef = useRef(false);
  const trimmedContent = content.trim();
  const isBusy = isLoading || isSubmitting;
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setContent(event.target.value);
    setErrorMessage(undefined);
  };
  const insertEmoji = (emoji: string) => {
    const start = inputRef.current?.selectionStart ?? content.length;
    const end = inputRef.current?.selectionEnd ?? start;
    setContent(content.slice(0, start) + emoji + content.slice(end));
    setErrorMessage(undefined);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };
  const submitComment = async (submittedContent: string) => {
    inFlightRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      await onSubmit(submittedContent);
      setContent("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to post comment. Please try again.");
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || inFlightRef.current) return;
    const validation = commentInputSchema.safeParse(trimmedContent);
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message ?? "Comment cannot be empty");
      return;
    }
    await submitComment(trimmedContent);
  };
  return {
    content, inputRef, errorMessage, isBusy, handleChange, handleSubmit, insertEmoji,
    isSubmitDisabled: !trimmedContent || trimmedContent.length > 500 || isBusy,
  };
}
