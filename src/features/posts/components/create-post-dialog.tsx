"use client";

import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { SpinnerIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useCreatePost } from "../use-create-post";
import { CreatePostPhotoPicker } from "./create-post-photo-picker";
import styles from "./create-post-dialog.module.css";

export interface CreatePostDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function validateImage(file: File): string | undefined {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Please upload a PNG, JPEG, or WebP image.";
  if (file.size > MAX_IMAGE_BYTES) return "Image size must not exceed 5MB.";
}

export function CreatePostDialog({ isOpen, onClose }: Readonly<CreatePostDialogProps>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [caption, setCaption] = useState("");
  const [imageError, setImageError] = useState<string>();
  const [captionError, setCaptionError] = useState<string>();
  const titleId = useId();
  const captionErrorId = `${titleId}-caption-error`;
  const { createPost, isLoading, error: apiError } = useCreatePost();

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleDeleteImage = () => {
    setSelectedFile(null);
    setPreviewUrl(undefined);
    setImageError(undefined);
  };

  const handleClose = () => {
    handleDeleteImage();
    setCaption("");
    setCaptionError(undefined);
    onClose();
  };

  const handleSelectFile = (file: File) => {
    const validationError = validateImage(file);
    setImageError(validationError);
    if (validationError) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    const hasCaption = caption.trim().length > 0;
    setImageError(selectedFile ? undefined : imageError ?? "Please upload a photo.");
    setCaptionError(hasCaption ? undefined : "Please enter a caption.");
    if (!selectedFile || !hasCaption) return;
    const createdPost = await createPost({ image: selectedFile, caption });
    if (createdPost) handleClose();
  };

  const handleCaptionChange = (value: string) => {
    setCaption(value.slice(0, 500));
    if (value.trim()) setCaptionError(undefined);
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} aria-labelledby={titleId}
      className={styles.dialog} overlayClassName={styles.overlay}>
      <header className="flex h-9 items-center gap-3">
        <button type="button" onClick={handleClose} aria-label="Back"
          className="flex h-9 w-8 items-center justify-center rounded-lg text-[#FDFDFD] transition-colors hover:bg-[#141820] focus-visible:outline-2 focus-visible:outline-[#7F51F9]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
            <path d="m12 4-8 8 8 8M4 12h16" />
          </svg>
        </button>
        <h2 id={titleId} className="text-2xl leading-9 font-bold text-[#FDFDFD]">Add Post</h2>
      </header>
      <form onSubmit={handleSubmit} className="mt-7">
        <CreatePostPhotoPicker previewUrl={previewUrl} error={imageError}
          onSelectFile={handleSelectFile} onDeleteImage={handleDeleteImage} />
        <label className="mt-5 flex flex-col gap-1.5">
          <span className="text-sm leading-5 font-semibold text-[#FDFDFD]">Caption</span>
          <textarea value={caption} onChange={(event) => handleCaptionChange(event.target.value)}
            placeholder="Create your caption" rows={3} maxLength={500}
            aria-invalid={Boolean(captionError)} aria-describedby={captionError ? captionErrorId : undefined}
            className={cn(
              "h-[101px] w-full resize-none rounded-xl border bg-[#0A0D12] px-[15px] py-3 text-base leading-6 text-[#FDFDFD] placeholder:text-[#535862] focus:outline-none",
              captionError ? "border-[#EE1D7A] focus:border-[#EE1D7A]" : "border-[#181D27] focus:border-[#7F51F9]",
            )} />
        </label>
        {captionError && <p id={captionErrorId} role="alert" className="mt-1.5 text-sm leading-5 text-[#EE1D7A]">{captionError}</p>}
        {selectedFile && <p className="mt-1.5 text-right text-xs text-[#A4A7AE]">{caption.length}/500</p>}
        {apiError && <p role="alert" className="mt-3 text-sm text-[#EE1D7A]">{apiError.message}</p>}
        <button type="submit" disabled={isLoading} aria-busy={isLoading}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6936F2] px-6 text-base font-semibold text-[#FDFDFD] transition-colors enabled:hover:bg-[#7F51F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7F51F9] disabled:cursor-not-allowed">
          {isLoading && <SpinnerIcon className="h-4 w-4" />}
          <span>Share</span>
        </button>
      </form>
    </Dialog>
  );
}
