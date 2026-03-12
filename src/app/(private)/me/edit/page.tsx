"use client";

import axios from "axios";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, updateMe } from "@/lib/social-api";
import { persistUserSnapshot } from "@/lib/session";
import { getLocalAvatar, setLocalAvatar } from "@/lib/local-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ErrorResponse = {
  message?: string;
};

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default function EditProfilePage() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const [draft, setDraft] = useState<{ name: string; phone: string; bio: string } | null>(null);
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const [pendingAvatarDataUrl, setPendingAvatarDataUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getLocalAvatar().then((localAvatar) => {
      if (localAvatar) {
        setAvatarOverride(localAvatar);
      }
    });
  }, []);

  const profile = meQuery.data?.profile;
  const baseDraft = useMemo(
    () => ({
      name: profile?.name ?? "",
      phone: profile?.phone ?? "",
      bio: profile?.bio ?? "",
    }),
    [profile?.bio, profile?.name, profile?.phone],
  );

  const name = draft?.name ?? baseDraft.name;
  const phone = draft?.phone ?? baseDraft.phone;
  const bio = draft?.bio ?? baseDraft.bio;
  const username = profile?.username ?? "";
  const email = profile?.email ?? "";
  const avatarPreview = avatarOverride || profile?.avatarUrl || DEFAULT_AVATAR;

  function updateDraft(patch: Partial<{ name: string; phone: string; bio: string }>) {
    setDraft((current) => ({
      ...(current ?? baseDraft),
      ...patch,
    }));
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setAvatarOverride(objectUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setPendingAvatarDataUrl(result);
    };
    reader.readAsDataURL(file);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      const data = await updateMe({
        name,
        phone,
        bio,
      });

      if (pendingAvatarDataUrl) {
        await setLocalAvatar(pendingAvatarDataUrl);
      }

      return data;
    },
    onSuccess: (data) => {
      persistUserSnapshot({
        name: data.profile.name,
        username: data.profile.username,
        avatarUrl: data.profile.avatarUrl,
      });
      queryClient.invalidateQueries({});
      window.location.href = "/me";
    },
    onError: (error: unknown) => {
      setFormError(getErrorMessage(error, "Gagal update profile"));
    },
  });

  if (meQuery.isPending) return <div className="p-6 text-white">Loading...</div>;
  if (meQuery.error || !meQuery.data) return <div className="p-6 text-white">Gagal mengambil profile</div>;

  return (
    <div className="mx-auto w-full max-w-[980px] px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-center gap-4">
        <Link href="/me" className="text-white transition hover:text-white/75">
          <ArrowLeft className="h-8 w-8" />
        </Link>
        <h1 className="text-4xl font-semibold text-white">Edit Profile</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[140px_1fr] lg:items-start">
        <div className="space-y-5">
          <img src={avatarPreview} alt="Avatar" className="h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32" />

          <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 px-6 py-3 text-base font-medium text-white transition hover:bg-white/[0.03]">
            Change Photo
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Name</label>
              <Input
                value={name}
                onChange={(event) => updateDraft({ name: event.target.value })}
                className="h-14 rounded-xl border-white/10 bg-[#050b16] text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Username</label>
              <Input value={username} readOnly className="h-14 rounded-xl border-white/10 bg-[#050b16] text-white opacity-70" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <Input value={email} readOnly className="h-14 rounded-xl border-white/10 bg-[#050b16] text-white opacity-70" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Number Phone</label>
              <Input
                value={phone}
                onChange={(event) => updateDraft({ phone: event.target.value })}
                className="h-14 rounded-xl border-white/10 bg-[#050b16] text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Bio</label>
            <Textarea
              value={bio}
              onChange={(event) => updateDraft({ bio: event.target.value })}
              className="min-h-40 rounded-[18px] border-white/10 bg-[#050b16] text-white"
            />
          </div>

          {formError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </div>
          ) : null}

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
  );
}
