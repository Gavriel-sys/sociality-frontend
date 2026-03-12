"use client";

import axios from "axios";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, updateMe } from "@/lib/social-api";
import { persistUserSnapshot } from "@/lib/session";
import { getLocalAvatar, setLocalAvatar } from "@/lib/local-avatar";
import { PageShell, Surface } from "@/components/page-shell";
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
    <PageShell
      eyebrow="Settings"
      title="Edit profile"
      description="Perbarui identitas utama kamu di Sociality. Avatar lokal juga akan tetap tampil di browser ini."
      actions={
        <Button asChild variant="outline" className="h-12 rounded-full px-6">
          <Link href="/me">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Surface className="space-y-5">
          <img src={avatarPreview} alt="Avatar" className="h-36 w-36 rounded-full object-cover ring-1 ring-white/10" />

          <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 px-6 py-3 text-base font-medium text-white">
            Change Photo
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>

          <p className="text-sm leading-6 text-white/55">
            Avatar yang kamu upload di sini disimpan secara lokal agar UI tetap konsisten walaupun backend belum menyediakan endpoint upload avatar profile.
          </p>
        </Surface>

        <Surface>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Name</label>
              <Input value={name} onChange={(event) => updateDraft({ name: event.target.value })} className="h-14 rounded-2xl border-white/10 bg-[#050b16] text-white" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Username</label>
              <Input value={username} readOnly className="h-14 rounded-2xl border-white/10 bg-[#050b16] text-white opacity-70" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <Input value={email} readOnly className="h-14 rounded-2xl border-white/10 bg-[#050b16] text-white opacity-70" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Phone</label>
              <Input value={phone} onChange={(event) => updateDraft({ phone: event.target.value })} className="h-14 rounded-2xl border-white/10 bg-[#050b16] text-white" />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <label className="text-sm font-medium text-white">Bio</label>
            <Textarea value={bio} onChange={(event) => updateDraft({ bio: event.target.value })} className="min-h-36 rounded-[28px] border-white/10 bg-[#050b16] text-white" />
          </div>

          {formError ? (
            <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </div>
          ) : null}

          <Button
            type="button"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="mt-6 h-14 w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-base font-semibold text-white"
          >
            {updateMutation.isPending ? "Save Changes..." : "Save Changes"}
          </Button>
        </Surface>
      </div>
    </PageShell>
  );
}
