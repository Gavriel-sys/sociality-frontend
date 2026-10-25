"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { SpinnerIcon, UploadIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useCreatePost } from "../use-create-post";

export interface CreatePostDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const MAX_BYTES = 5 * 1024 * 1024;
const VALID_MIMES = ["image/png", "image/jpeg", "image/webp"];
const revokeUrl = (url: string | null) => { if (url && typeof URL !== "undefined") URL.revokeObjectURL(url); };

export function CreatePostDialog({ isOpen, onClose }: Readonly<CreatePostDialogProps>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPost, isLoading, error: apiError } = useCreatePost();

  useEffect(() => () => revokeUrl(previewUrl), [previewUrl]);

  const handleClose = () => {
    revokeUrl(previewUrl);
    setSelectedFile(null); setPreviewUrl(null); setCaption("");
    setErrorMessage(null); setIsDragOver(false);
    onClose();
  };

  const handleSelectFile = (candidate: File) => {
    if (!VALID_MIMES.includes(candidate.type)) {
      setErrorMessage("Please upload a PNG, JPEG, or WebP image.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setErrorMessage("Image size must not exceed 5MB.");
      return;
    }
    revokeUrl(previewUrl);
    setSelectedFile(candidate);
    setPreviewUrl(typeof URL !== "undefined" ? URL.createObjectURL(candidate) : "");
    setErrorMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isLoading) return;
    const created = await createPost({ image: selectedFile, caption });
    if (created) handleClose();
  };

  const displayedError = errorMessage ?? apiError?.message ?? null;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Create new post">
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {displayedError && (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {displayedError}
          </div>
        )}
        <input
          ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
          data-testid="file-input" aria-label="Upload image"
          onChange={(e) => {
            const next = e.target.files?.[0];
            if (next) handleSelectFile(next);
            e.target.value = "";
          }}
        />
        {previewUrl ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#1F242F] bg-[#141820]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Selected preview" className="h-full w-full object-cover" />
            <button
              type="button" onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 rounded-lg border border-[#1F242F] bg-[#0A0D12]/80 px-3 py-1.5 text-xs font-medium text-[#FDFDFD] backdrop-blur-md hover:bg-[#0A0D12]"
            >
              Change photo
            </button>
          </div>
        ) : (
          <div
            role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault(); setIsDragOver(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) handleSelectFile(dropped);
            }}
            aria-label="Drag and drop image here or click to browse"
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors",
              isDragOver ? "border-[#7F51F9] bg-[#7F51F9]/10" : "border-[#1F242F] hover:border-[#373A41] bg-[#0A0D12]",
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#141820] text-[#7F51F9]">
              <UploadIcon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#FDFDFD]">Choose a file or drag & drop it here</p>
              <p className="mt-1 text-xs text-[#A4A7AE]">PNG, JPEG, WebP up to 5MB</p>
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <textarea
            value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 500))}
            placeholder="Write a caption..." rows={3} maxLength={500}
            className="w-full resize-none rounded-xl border border-[#1F242F] bg-[#141820] p-3 text-sm text-[#FDFDFD] placeholder:text-[#A4A7AE] focus:border-[#7F51F9] focus:outline-none"
          />
          <div className="flex justify-end text-xs text-[#A4A7AE]"><span>{caption.length}/500</span></div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={handleClose} className="rounded-xl border border-[#1F242F] px-4 py-2 text-sm font-medium text-[#A4A7AE] hover:bg-[#141820] hover:text-[#FDFDFD]">
            Cancel
          </button>
          <button type="submit" disabled={!selectedFile || isLoading} className="flex items-center gap-2 rounded-xl bg-[#6936F2] px-5 py-2 text-sm font-medium text-[#FDFDFD] hover:bg-[#7F51F9] disabled:cursor-not-allowed disabled:opacity-50">
            {isLoading ? <SpinnerIcon className="h-4 w-4" /> : null}
            <span>Share</span>
          </button>
        </div>
      </form>
    </Dialog>
  );
}
