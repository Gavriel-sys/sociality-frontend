"use client";

import axios from "axios";
import Link from "next/link";
import { ImagePlus, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/lib/social-api";
import { PageShell, Surface } from "@/components/page-shell";
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
    <PageShell
      eyebrow="Create"
      title="Buat post yang siap masuk ke feed tanpa ribet."
      description="Upload satu gambar, tambahkan caption yang jelas, lalu publish. Setelah berhasil, post langsung muncul di feed dan profile kamu."
      actions={
        <Button asChild variant="outline" className="h-12 rounded-full px-6">
          <Link href="/feed">Kembali ke Feed</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Surface>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Gambar</label>
              <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6 text-center text-white/55">
                <ImagePlus className="mb-4 h-8 w-8 text-violet-300" />
                <span className="font-medium text-white">Upload gambar post</span>
                <span className="mt-2 text-sm">Klik area ini untuk memilih file gambar.</span>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>

            {previewUrl ? (
              <div className="overflow-hidden rounded-[28px] border border-white/10">
                <img src={previewUrl} alt="Preview" className="aspect-[4/3] w-full object-cover" />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Caption</label>
              <Textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Tulis caption kamu..."
                className="min-h-36 rounded-[28px] border-white/10 bg-[#050b16] text-white placeholder:text-white/35"
              />
            </div>

            {formError ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {formError}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-base font-semibold text-white"
            >
              {createMutation.isPending ? "Posting..." : "Publish Post"}
            </Button>
          </form>
        </Surface>

        <Surface className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-violet-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-white">Tips sebelum publish</h2>
          <ul className="space-y-3 text-sm leading-6 text-white/55">
            <li>Gunakan gambar yang jelas karena preview card akan menonjolkan visual utama.</li>
            <li>Buat caption singkat tapi kuat supaya nyaman dibaca di feed dan detail page.</li>
            <li>Setelah post terbit, kamu bisa lihat hasilnya di feed dan profile pribadi.</li>
          </ul>
        </Surface>
      </div>
    </PageShell>
  );
}
