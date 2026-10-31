"use client";

import { useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { CreatePostImagePreview } from "./create-post-image-preview";

interface CreatePostPhotoPickerProps {
  readonly previewUrl?: string;
  readonly error?: string;
  readonly onSelectFile: (file: File) => void;
  readonly onDeleteImage: () => void;
}

function CloudUploadIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#181D27]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
        strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#FDFDFD]" aria-hidden="true">
        <path d="M5 16.5a5 5 0 0 1-.9-9.1 7 7 0 0 1 13.4 1.1 4 4 0 0 1 1.5 7.7M12 21V11m-4 4 4-4 4 4" />
      </svg>
    </span>
  );
}

export function CreatePostPhotoPicker({ previewUrl, error, onSelectFile, onDeleteImage }: CreatePostPhotoPickerProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) onSelectFile(selectedFile);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) onSelectFile(droppedFile);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm leading-5 font-semibold text-[#FDFDFD]">Photo</label>
      <input ref={fileInputRef} id={inputId} type="file" accept="image/png,image/jpeg,image/webp"
        className="hidden" data-testid="file-input" aria-label="Upload image"
        aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={handleFileChange} />
      {previewUrl ? (
        <CreatePostImagePreview previewUrl={previewUrl} onChangeImage={openFilePicker} onDeleteImage={onDeleteImage} />
      ) : (
        <button type="button" onClick={openFilePicker} onDrop={handleDrop}
          onDragOver={(event) => { event.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(event) => { event.preventDefault(); setIsDragOver(false); }}
          aria-label="Drag and drop image here or click to browse"
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-[#0A0D12] text-sm leading-5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7F51F9]",
            error ? "border-[#EE1D7A]" : isDragOver ? "border-[#7F51F9]" : "border-[#181D27] hover:border-[#535862]",
          )}>
          <CloudUploadIcon />
          <span className="text-[#535862]"><span className="text-[#7F51F9]">Click to upload</span> or drag and drop</span>
          <span className="text-[#535862]">PNG or JPG (max. 5mb)</span>
        </button>
      )}
      {error && <p id={errorId} role="alert" className="mt-1 text-sm leading-5 text-[#EE1D7A]">{error}</p>}
    </div>
  );
}
