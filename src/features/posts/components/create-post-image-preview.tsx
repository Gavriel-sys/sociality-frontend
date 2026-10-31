"use client";

import Image from "next/image";

interface ImageActionsProps {
  readonly onChangeImage: () => void;
  readonly onDeleteImage: () => void;
}

interface CreatePostImagePreviewProps extends ImageActionsProps {
  readonly previewUrl: string;
}

const ACTION_BUTTON_CLASS = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#181D27] px-3 text-sm leading-5 transition-colors hover:bg-[#1F242F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7F51F9]";

function ImageActions({ onChangeImage, onDeleteImage }: ImageActionsProps) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-3">
      <button type="button" onClick={onChangeImage} className={`${ACTION_BUTTON_CLASS} text-[#FDFDFD]`}>
        <Image src="/icons/phase-arrow.svg" width={20} height={20} alt="" />
        Change Image
      </button>
      <button type="button" onClick={onDeleteImage} className={`${ACTION_BUTTON_CLASS} text-[#B41759]`}>
        <Image src="/icons/trash.svg" width={20} height={20} alt="" />
        Delete Image
      </button>
    </div>
  );
}

export function CreatePostImagePreview({ previewUrl, ...actions }: CreatePostImagePreviewProps) {
  return (
    <div className="flex w-full flex-col items-center rounded-xl border border-dashed border-[#181D27] bg-[#0A0D12] px-4 pt-[15px] pb-[55px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt="Selected preview" className="aspect-square w-full max-w-[396px] object-cover" />
      <ImageActions {...actions} />
    </div>
  );
}
