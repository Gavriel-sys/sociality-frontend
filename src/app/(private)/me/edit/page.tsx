"use client";

import axios from "axios";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, authHeaders, unwrapResponse } from "@/lib/api";
import type { MeData } from "@/types/social";
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

async function fetchMe(): Promise<MeData> {
  const res = await api.get("/me", {
    headers: authHeaders(),
  });

  return unwrapResponse<MeData>(res);
}

export default function EditProfilePage() {
  const queryClient = useQueryClient();

  const {
    data: me,
    isPending,
    error,
  } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(
    "/avatars/default-avatar.png",
  );
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!me) return;

    setName(me.profile.name ?? "");
    setUsername(me.profile.username ?? "");
    setEmail(me.profile.email ?? "");
    setPhone(me.profile.phone ?? "");
    setBio(me.profile.bio ?? "");
    setAvatarPreview(me.profile.avatarUrl || "/avatars/default-avatar.png");
  }, [me]);

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(
        "/me",
        {
          name,
          phone,
          bio,
        },
        {
          headers: authHeaders(),
        },
      );
    },
    onSuccess: () => {
      localStorage.setItem("me_username", name || username);
      localStorage.setItem("me_avatar", avatarPreview);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      window.location.href = "/me";
    },
    onError: (error: unknown) => {
      setFormError(getErrorMessage(error, "Gagal update profile"));
    },
  });

  if (isPending) return <div className="p-6 text-white">Loading...</div>;
  if (error || !me)
    return <div className="p-6 text-white">Gagal mengambil profile</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/me"
            className="inline-flex items-center gap-3 text-2xl font-semibold"
          >
            <ArrowLeft className="h-7 w-7" />
            Edit Profile
          </Link>
        </div>

        <div className="grid gap-10 md:grid-cols-[220px_1fr]">
          <div className="space-y-5">
            <img
              src={avatarPreview}
              alt="Avatar"
              className="h-28 w-28 rounded-full object-cover"
            />

            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 px-6 py-3 text-base font-medium text-white">
              Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 border-white/10 bg-[#050b16] text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Username</label>
              <Input
                value={username}
                readOnly
                className="h-14 border-white/10 bg-[#050b16] text-white opacity-70"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <Input
                value={email}
                readOnly
                className="h-14 border-white/10 bg-[#050b16] text-white opacity-70"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Number Phone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 border-white/10 bg-[#050b16] text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-28 border-white/10 bg-[#050b16] text-white"
              />
            </div>

            {formError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {formError}
              </div>
            )}

            <Button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="h-14 w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-base font-semibold text-white"
            >
              {updateMutation.isPending ? "Save Changes..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
