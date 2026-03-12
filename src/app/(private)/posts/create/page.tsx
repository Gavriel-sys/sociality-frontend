"use client";

import axios from "axios";
import Link from "next/link";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/lib/social-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ErrorResponse = {
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default function CreatePostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [formError, setFormError] = useState("");

  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile) {
        throw new Error("Gambar wajib diisi");
      }

      if (!caption.trim()) {
        throw new Error("Caption wajib diisi");
      }

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("caption", caption.trim());

      return createPost(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({});
      router.push("/feed");
    },
    onError: (error: unknown) => {
      setFormError(getErrorMessage(error, "Gagal membuat post"));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    createMutation.mutate();
  }

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-center gap-4">
        <Link href="/feed" className="text-white transition hover:text-white/75">
          <ArrowLeft className="h-8 w-8" />
        </Link>
        <h1 className="text-4xl font-semibold text-white">Add Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Photo</label>
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-white/12 bg-[#050b16] px-6 py-8 text-center">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white">
              <ImagePlus className="h-5 w-5" />
            </div>
            <p className="text-sm text-white/85">
              <span className="font-medium text-violet-400">Click to upload</span> or drag and drop
            </p>
            <p className="mt-2 text-xs text-white/38">PNG or JPG (max. 5mb)</p>
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>

        {previewUrl ? (
          <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#050b16]">
            <img src={previewUrl} alt="Preview" className="aspect-square w-full object-cover" />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Caption</label>
          <Textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Create your caption"
            className="min-h-32 rounded-[14px] border-white/10 bg-[#050b16] text-white placeholder:text-white/30"
          />
        </div>

        {formError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {formError}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-base font-semibold text-white"
        >
          {createMutation.isPending ? "Sharing..." : "Share"}
        </Button>
      </form>
    </div>
  );
}
