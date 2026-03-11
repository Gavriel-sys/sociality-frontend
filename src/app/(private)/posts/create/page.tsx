"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, authHeaders } from "@/lib/api";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!imageFile) {
      setFormError("Gambar wajib diisi");
      return;
    }

    if (!caption.trim()) {
      setFormError("Caption wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("caption", caption);

      await api.post("/posts", formData, {
        headers: authHeaders(),
      });

      router.push("/feed");
    } catch (error: unknown) {
      setFormError(getErrorMessage(error, "Gagal membuat post"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create Post</h1>
        <p className="text-sm text-gray-500">
          Upload 1 gambar dan tulis caption.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Gambar</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setImageFile(file);
            }}
          />
        </div>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="h-64 w-full rounded-xl object-cover"
          />
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Caption</label>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Tulis caption kamu..."
          />
        </div>

        {formError && <div className="text-sm text-red-500">{formError}</div>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </Button>
      </form>
    </div>
  );
}
